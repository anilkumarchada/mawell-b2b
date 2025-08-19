import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole, PaymentStatus, PaymentMethod } from '@mawell/shared';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate payment for order' })
  @ApiResponse({ status: 201, description: 'Payment initiated successfully' })
  async initiatePayment(
    @Body() paymentData: {
      orderId: string;
      amount: number;
      method: PaymentMethod;
      currency?: string;
    },
    @User() user: any,
  ) {
    return this.paymentsService.initiatePayment(paymentData, user.id);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify payment' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  async verifyPayment(
    @Body() verificationData: {
      paymentId: string;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
      razorpaySignature?: string;
    },
    @User() user: any,
  ) {
    return this.paymentsService.verifyPayment(verificationData, user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get payment history' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getPaymentHistory(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: PaymentStatus,
    @User() user?: any,
  ) {
    return this.paymentsService.getPaymentHistory(user.id, page, limit, status);
  }

  @Get(':paymentId')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, description: 'Payment details retrieved successfully' })
  async getPaymentDetails(
    @Param('paymentId') paymentId: string,
    @User() user: any,
  ) {
    return this.paymentsService.getPaymentDetails(paymentId, user.id, user.role);
  }

  @Put(':paymentId/refund')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiOperation({ summary: 'Process refund' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  async processRefund(
    @Param('paymentId') paymentId: string,
    @Body() refundData: {
      amount?: number;
      reason: string;
    },
    @User() user: any,
  ) {
    return this.paymentsService.processRefund(paymentId, refundData, user.id);
  }

  @Post('webhook/razorpay')
  @Public()
  @ApiOperation({ summary: 'Razorpay webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleRazorpayWebhook(@Body() webhookData: any) {
    return this.paymentsService.handleRazorpayWebhook(webhookData);
  }

  @Get('admin/analytics')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiOperation({ summary: 'Get payment analytics' })
  @ApiResponse({ status: 200, description: 'Payment analytics retrieved successfully' })
  async getPaymentAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @User() user?: any,
  ) {
    return this.paymentsService.getPaymentAnalytics(startDate, endDate, user.id, user.role);
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Payments service health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'payments',
      timestamp: new Date().toISOString(),
    };
  }
}