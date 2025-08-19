import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
// import { AuditService } from '../audit/audit.service'; // Commented out - service not implemented yet
import { PaymentStatus, PaymentMethod, UserRole } from '@mawell/shared';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    // private readonly auditService: AuditService, // Commented out - service not implemented yet
  ) {
    const keyId = this.configService.get('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');
    
    if (keyId && keySecret) {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } else {
      this.logger.warn('Razorpay credentials not configured');
    }
  }

  async initiatePayment(
    paymentData: {
      orderId: string;
      amount: number;
      method: PaymentMethod;
      currency?: string;
    },
    userId: string,
  ) {
    this.logger.log(`Initiating payment for order ${paymentData.orderId} by user ${userId}`);
    
    if (!this.razorpay) {
      throw new BadRequestException('Payment gateway not configured');
    }

    try {
      const options = {
        amount: paymentData.amount * 100, // Convert to paise
        currency: paymentData.currency || 'INR',
        receipt: `order_${paymentData.orderId}_${Date.now()}`,
        notes: {
          orderId: paymentData.orderId,
          userId: userId,
        },
      };

      const order = await this.razorpay.orders.create(options);

      // Save payment record in database
      const payment = await this.prisma.payment.create({
        data: {
          orderId: paymentData.orderId,
          razorpayOrderId: order.id,
          amount: paymentData.amount,
          currency: options.currency,
          status: PaymentStatus.PENDING,
          paymentMethod: paymentData.method,
        },
      });

      // Log audit trail
      // await this.auditService.logCreate(
      //   'Payment',
      //   payment.id,
      //   payment,
      //   userId,
      // ); // Commented out - audit service not implemented yet

      return {
        success: true,
        message: 'Payment initiated successfully',
        data: {
          id: payment.id,
          razorpayOrderId: order.id,
          amount: payment.amount, // Using payment amount instead of order amount
          currency: order.currency,
          receipt: order.receipt,
          status: order.status,
        },
      };
    } catch (error) {
      this.logger.error('Failed to create Razorpay order:', error);
      throw new BadRequestException('Failed to create payment order');
    }
  }

  async verifyPayment(
    verificationData: {
      paymentId: string;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
      razorpaySignature?: string;
    },
    userId: string,
  ) {
    this.logger.log(`Verifying payment ${verificationData.paymentId} for user ${userId}`);
    
    if (!this.razorpay) {
      throw new BadRequestException('Payment gateway not configured');
    }

    if (!verificationData.razorpayOrderId || !verificationData.razorpayPaymentId || !verificationData.razorpaySignature) {
      throw new BadRequestException('Missing required verification data');
    }

    try {

      const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');
      
      const body = verificationData.razorpayOrderId + '|' + verificationData.razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body.toString())
        .digest('hex');

      const isValid = expectedSignature === verificationData.razorpaySignature;

      // Find and update payment record
      const payment = await this.prisma.payment.findUnique({
        where: { id: verificationData.paymentId },
      });

      if (!payment) {
        throw new NotFoundException('Payment record not found');
      }

      await this.prisma.payment.update({
        where: { id: verificationData.paymentId },
        data: {
          razorpayPaymentId: verificationData.razorpayPaymentId,
          status: isValid ? PaymentStatus.PAID : PaymentStatus.FAILED,
          updatedAt: new Date(),
        },
      });

      // Update order status if payment is successful
      if (isValid) {
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
          },
        });
      }

      // Log audit trail
      // await this.auditService.logUpdate(
      //   'Payment',
      //   payment.id,
      //   { status: payment.status },
      //   { status: updatedPayment.status },
      //   userId,
      // ); // Commented out - audit service not implemented yet

      if (!isValid) {
        throw new BadRequestException('Payment verification failed');
      }

      return {
        success: true,
        message: 'Payment verified successfully',
        data: {
          paymentId: verificationData.paymentId,
          status: PaymentStatus.PAID,
          verifiedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Payment verification failed:', error);
      throw new BadRequestException('Payment verification failed');
    }
  }

  async getPaymentHistory(
    userId: string,
    page: number,
    limit: number,
    _status?: PaymentStatus,
  ) {
    this.logger.log(`Getting payment history for user ${userId}`);
    
    // Mock implementation
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  async getPaymentDetails(paymentId: string, userId: string, _userRole: UserRole) {
    this.logger.log(`Getting payment details ${paymentId} for user ${userId}`);
    
    // Mock implementation
    return {
      id: paymentId,
      orderId: `order_${Date.now()}`,
      userId,
      amount: 1000,
      currency: 'INR',
      method: PaymentMethod.UPI,
      status: PaymentStatus.PAID,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  }

  async processRefund(
    paymentId: string,
    refundData: {
      amount?: number;
      reason: string;
    },
    adminId: string,
  ) {
    this.logger.log(`Processing refund for payment ${paymentId} by admin ${adminId}`);
    
    // Mock implementation - in real app, process refund with Razorpay
    const refund = {
      id: `rfnd_${Date.now()}`,
      paymentId,
      amount: refundData.amount,
      reason: refundData.reason,
      status: 'processed',
      processedBy: adminId,
      processedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: 'Refund processed successfully',
      data: refund,
    };
  }

  async handleRazorpayWebhook(_webhookData: any) {
    this.logger.log('Processing Razorpay webhook');
    
    // Mock implementation - in real app, handle webhook events
    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  }

  async getPaymentAnalytics(
    startDate?: string,
    endDate?: string,
    adminId?: string,
    adminRole?: UserRole,
  ) {
    this.logger.log(`Getting payment analytics for admin ${adminId}`);
    
    if (adminRole !== UserRole.ADMIN && adminRole !== UserRole.OPS) {
      throw new ForbiddenException('Insufficient permissions to view payment analytics');
    }

    // Mock implementation
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      successRate: 0,
      averageOrderValue: 0,
      paymentMethodBreakdown: {},
      dailyRevenue: [],
      refunds: {
        total: 0,
        amount: 0,
      },
    };
  }
}