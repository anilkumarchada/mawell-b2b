import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import { generateOTP } from '@mawell/shared';
import axios from 'axios';

export interface SendOtpResult {
  success: boolean;
  message: string;
  requestId?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  remainingAttempts?: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpLength: number;
  private readonly otpExpiryMinutes: number;
  private readonly maxAttempts: number;
  private readonly cooldownMinutes: number;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {
    this.otpLength = this.configService.get<number>('otp.length', 6);
    this.otpExpiryMinutes = this.configService.get<number>('otp.expiryMinutes', 10);
    this.maxAttempts = this.configService.get<number>('otp.maxAttempts', 3);
    this.cooldownMinutes = this.configService.get<number>('otp.cooldownMinutes', 15);
  }

  /**
   * Generate and send OTP to phone number
   */
  async sendOtp(phone: string, purpose: string = 'LOGIN'): Promise<SendOtpResult> {
    try {
      // Check if user is in cooldown period
      const cooldownCheck = await this.checkCooldown(phone);
      if (!cooldownCheck.canSend) {
        return {
          success: false,
          message: `Please wait ${cooldownCheck.remainingMinutes} minutes before requesting another OTP`,
        };
      }

      // Generate OTP
      const otp = generateOTP();
      const hashedOtp = this.encryptionService.hash(otp);
      const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

      // Store OTP in database
      await this.prisma.oTPAttempt.create({
        data: {
          phone,
          otp,
          hashedOtp,
          purpose,
          expiresAt,
          attempts: 0,
        },
      });

      // Send OTP via SMS
      const smsResult = await this.sendSms(phone, otp, purpose);
      
      if (!smsResult.success) {
        this.logger.error(`Failed to send OTP to ${phone}: ${smsResult.message}`);
        return {
          success: false,
          message: 'Failed to send OTP. Please try again.',
        };
      }

      this.logger.log(`OTP sent successfully to ${this.encryptionService.maskPhoneNumber(phone)}`);
      
      return {
        success: true,
        message: 'OTP sent successfully',
        requestId: smsResult.requestId,
      };
    } catch (error) {
      this.logger.error('Error sending OTP', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.',
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOtp(phone: string, otp: string, purpose: string = 'LOGIN'): Promise<VerifyOtpResult> {
    try {
      // Find the latest OTP attempt for this phone and purpose
      const otpAttempt = await this.prisma.oTPAttempt.findFirst({
        where: {
          phone,
          purpose,
          expiresAt: {
            gt: new Date(),
          },
          verified: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!otpAttempt) {
        return {
          success: false,
          message: 'OTP not found or expired. Please request a new OTP.',
        };
      }

      // Check if max attempts exceeded
      if (otpAttempt.attempts >= this.maxAttempts) {
        await this.prisma.oTPAttempt.update({
          where: { id: otpAttempt.id },
          data: { verified: true },
        });
        
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        };
      }

      // Increment attempt count
      await this.prisma.oTPAttempt.update({
        where: { id: otpAttempt.id },
        data: { attempts: otpAttempt.attempts + 1 },
      });

      // Verify OTP
      const isValid = this.encryptionService.verifyHash(otp, otpAttempt.hashedOtp);
      
      if (!isValid) {
        const remainingAttempts = this.maxAttempts - (otpAttempt.attempts + 1);
        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
          remainingAttempts,
        };
      }

      // Mark OTP as used
      await this.prisma.oTPAttempt.update({
        where: { id: otpAttempt.id },
        data: {
          verified: true,
        },
      });

      this.logger.log(`OTP verified successfully for ${this.encryptionService.maskPhoneNumber(phone)}`);
      
      return {
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      this.logger.error('Error verifying OTP', error);
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.',
      };
    }
  }

  /**
   * Check if user is in cooldown period
   */
  private async checkCooldown(phone: string): Promise<{ canSend: boolean; remainingMinutes?: number }> {
    const cooldownTime = new Date(Date.now() - this.cooldownMinutes * 60 * 1000);
    
    const recentAttempt = await this.prisma.oTPAttempt.findFirst({
      where: {
        phone,
        createdAt: {
          gt: cooldownTime,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!recentAttempt) {
      return { canSend: true };
    }

    const timeDiff = Date.now() - recentAttempt.createdAt.getTime();
    const remainingTime = (this.cooldownMinutes * 60 * 1000) - timeDiff;
    
    if (remainingTime > 0) {
      return {
        canSend: false,
        remainingMinutes: Math.ceil(remainingTime / (60 * 1000)),
      };
    }

    return { canSend: true };
  }

  /**
   * Send SMS using configured provider
   */
  private async sendSms(phone: string, otp: string, purpose: string): Promise<{ success: boolean; message: string; requestId?: string }> {
    const provider = this.configService.get<string>('sms.provider');
    
    switch (provider) {
      case 'MSG91':
        return this.sendViaMSG91(phone, otp, purpose);
      case 'TWILIO':
        return this.sendViaTwilio(phone, otp, purpose);
      default:
        // For development, log OTP instead of sending
        if (this.configService.get<string>('NODE_ENV') === 'development') {
          this.logger.log(`[DEV] OTP for ${phone}: ${otp}`);
          return {
            success: true,
            message: 'OTP logged for development',
            requestId: 'dev-' + Date.now(),
          };
        }
        return {
          success: false,
          message: 'SMS provider not configured',
        };
    }
  }

  /**
   * Send SMS via MSG91
   */
  private async sendViaMSG91(phone: string, otp: string, purpose: string): Promise<{ success: boolean; message: string; requestId?: string }> {
    try {
      const authKey = this.configService.get<string>('sms.msg91.authKey');
      const templateId = this.configService.get<string>('sms.msg91.templateId');
      
      const response = await axios.post('https://api.msg91.com/api/v5/otp', {
        template_id: templateId,
        mobile: phone,
        authkey: authKey,
        otp,
        purpose,
      });

      if (response.data.type === 'success') {
        return {
          success: true,
          message: 'OTP sent successfully',
          requestId: response.data.request_id,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Failed to send OTP',
      };
    } catch (error) {
      this.logger.error('MSG91 SMS error', error);
      return {
        success: false,
        message: 'SMS service error',
      };
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(phone: string, otp: string, _purpose: string): Promise<{ success: boolean; message: string; requestId?: string }> {
    try {
      const accountSid = this.configService.get<string>('sms.twilio.accountSid');
      const authToken = this.configService.get<string>('sms.twilio.authToken');
      const fromNumber = this.configService.get<string>('sms.twilio.fromNumber');
      
      const message = `Your MAWELL B2B verification code is: ${otp}. Valid for ${this.otpExpiryMinutes} minutes. Do not share this code.`;
      
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        new URLSearchParams({
          To: `+91${phone}`,
          From: fromNumber,
          Body: message,
        }),
        {
          auth: {
            username: accountSid,
            password: authToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return {
        success: true,
        message: 'OTP sent successfully',
        requestId: response.data.sid,
      };
    } catch (error) {
      this.logger.error('Twilio SMS error', error);
      return {
        success: false,
        message: 'SMS service error',
      };
    }
  }

  /**
   * Clean up expired OTP attempts
   */
  async cleanupExpiredOtps(): Promise<void> {
    try {
      const result = await this.prisma.oTPAttempt.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      
      this.logger.log(`Cleaned up ${result.count} expired OTP attempts`);
    } catch (error) {
      this.logger.error('Error cleaning up expired OTPs', error);
    }
  }
}