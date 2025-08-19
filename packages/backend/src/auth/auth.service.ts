import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { AuditService } from '../common/services/audit.service';
import { ValidationService } from '../common/services/validation.service';
import { UserRole, Language } from '@mawell/shared';
import { JwtPayload } from './strategies/jwt.strategy';

export interface LoginDto {
  phone: string;
  otp: string;
}

export interface RegisterDto {
  phone: string;
  name: string;
  role: UserRole;
  language?: Language;
  // Buyer specific fields
  businessName?: string;
  gstin?: string;
  // Driver specific fields
  licenseNumber?: string;
  vehicleNumber?: string;
}

export interface SendOtpDto {
  phone: string;
  purpose?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    phone: string;
    role: UserRole;
    isPhoneVerified: boolean;
    language: Language;
    createdAt: Date;
    buyerProfile?: any;
    driverProfile?: any;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private auditService: AuditService,
    private validationService: ValidationService,
  ) {}

  /**
   * Send OTP for authentication
   */
  async sendOtp(sendOtpDto: SendOtpDto, ipAddress?: string, userAgent?: string) {
    const { phone, purpose = 'LOGIN' } = sendOtpDto;

    // Validate phone number
    const phoneValidation = this.validationService.validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      throw new BadRequestException(phoneValidation.error);
    }

    const formattedPhone = phoneValidation.formatted!;

    // Send OTP
    const result = await this.otpService.sendOtp(formattedPhone, purpose);
    
    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    // Log audit trail
    await this.auditService.log({
      action: 'SEND_OTP',
      resource: 'AUTH',
      ipAddress,
      userAgent,
      metadata: {
        phone: formattedPhone,
        purpose,
      },
    });

    return {
      message: result.message,
      requestId: result.requestId,
    };
  }

  /**
   * Register new user
   */
  async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { phone, role, language = Language.ENGLISH, ...profileData } = registerDto;

    // Validate phone number
    const phoneValidation = this.validationService.validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      throw new BadRequestException(phoneValidation.error);
    }

    const formattedPhone = phoneValidation.formatted!;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Validate role-specific data
    if (role === UserRole.BUYER && profileData.businessName) {
      if (profileData.gstin) {
        const gstinValidation = this.validationService.validateGSTIN(profileData.gstin);
        if (!gstinValidation.isValid) {
          throw new BadRequestException(gstinValidation.error);
        }
      }
    }

    // Create user with profile in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          phone: formattedPhone,
          name: registerDto.name,
          role,
          language,
          isPhoneVerified: false,
          isActive: true,
        },
      });

      // Create role-specific profile
      if (role === UserRole.BUYER) {
        await tx.buyerProfile.create({
          data: {
            userId: newUser.id,
            shopName: profileData.businessName || '',
            gstin: profileData.gstin,
            kycStatus: 'PENDING',
          },
        });
      } else if (role === UserRole.DRIVER) {
        await tx.driverProfile.create({
          data: {
            userId: newUser.id,
            licenseNumber: profileData.licenseNumber || '',
            vehicleNumber: profileData.vehicleNumber || '',
            isAvailable: false,
            kycStatus: 'PENDING',
          },
        });
      }

      return newUser;
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Log audit trail
    await this.auditService.logCreate(
      'USER',
      user.id,
      { phone: formattedPhone, role },
      user.id,
      role,
      { ipAddress, userAgent },
    );

    // Get user with profile
    const userWithProfile = await this.getUserWithProfile(user.id);

    this.logger.log(`User registered successfully: ${this.validationService.maskPhoneNumber(formattedPhone)}`);

    return {
      user: userWithProfile,
      tokens,
    };
  }

  /**
   * Login user with OTP
   */
  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { phone, otp } = loginDto;

    // Validate phone number
    const phoneValidation = this.validationService.validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      throw new BadRequestException(phoneValidation.error);
    }

    const formattedPhone = phoneValidation.formatted!;

    // Verify OTP
    const otpResult = await this.otpService.verifyOtp(formattedPhone, otp, 'LOGIN');
    if (!otpResult.success) {
      // Log failed login attempt
      await this.auditService.logFailedLogin(
        formattedPhone,
        ipAddress,
        userAgent,
        otpResult.message,
      );
      throw new UnauthorizedException(otpResult.message);
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Mark phone as verified if not already
    if (!user.isPhoneVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Log successful login
    await this.auditService.logLogin(
      user.id,
      user.role as UserRole,
      ipAddress,
      userAgent,
    );

    // Get user with profile
    const userWithProfile = await this.getUserWithProfile(user.id);

    this.logger.log(`User logged in successfully: ${this.validationService.maskPhoneNumber(formattedPhone)}`);

    return {
      user: userWithProfile,
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = this.jwtService.sign(
        {
          sub: user.id,
          phone: user.phone,
          role: user.role,
        } as JwtPayload,
        {
          secret: this.configService.get<string>('jwt.secret'),
          expiresIn: this.configService.get<string>('jwt.expiresIn'),
        },
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await this.auditService.logLogout(
        user.id,
        user.role as UserRole,
        ipAddress,
        userAgent,
      );
    }

    // In a production app, you might want to blacklist the token
    // or store logout events in a separate table
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Get user with profile data
   */
  private async getUserWithProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: {
          include: {
            cartItems: true,
          },
        },
        driverProfile: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      phone: user.phone,
      role: user.role as UserRole,
      isPhoneVerified: user.isPhoneVerified,
      language: user.language as Language,
      createdAt: user.createdAt,
      buyerProfile: user.buyerProfile,
      driverProfile: user.driverProfile,
    };
  }

  /**
   * Verify phone number with OTP
   */
  async verifyPhone(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
    const phoneValidation = this.validationService.validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      throw new BadRequestException(phoneValidation.error);
    }

    const formattedPhone = phoneValidation.formatted!;

    const otpResult = await this.otpService.verifyOtp(formattedPhone, otp, 'PHONE_VERIFICATION');
    if (!otpResult.success) {
      throw new BadRequestException(otpResult.message);
    }

    // Update user phone verification status
    await this.prisma.user.updateMany({
      where: { phone: formattedPhone },
      data: { isPhoneVerified: true },
    });

    return {
      success: true,
      message: 'Phone number verified successfully',
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    return this.getUserWithProfile(userId);
  }
}