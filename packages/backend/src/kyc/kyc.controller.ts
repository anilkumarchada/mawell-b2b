import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole, KYCStatus } from '@mawell/shared';

@ApiTags('KYC')
@Controller('kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @UseInterceptors(FilesInterceptor('documents', 10))
  @ApiOperation({ summary: 'Submit KYC documents' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'KYC documents submitted successfully' })
  async submitKyc(
    @Body() kycData: any,
    @UploadedFiles() documents: Express.Multer.File[],
    @User() user: any,
  ) {
    return this.kycService.submitKyc(user.id, kycData, documents);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get KYC status' })
  @ApiResponse({ status: 200, description: 'KYC status retrieved successfully' })
  async getKycStatus(@User() user: any) {
    return this.kycService.getKycStatus(user.id);
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiOperation({ summary: 'Get pending KYC applications' })
  @ApiResponse({ status: 200, description: 'Pending KYC applications retrieved successfully' })
  async getPendingKyc(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @User() user: any,
  ) {
    return this.kycService.getPendingKyc(page, limit, user.id, user.role);
  }

  @Put(':kycId/review')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiOperation({ summary: 'Review KYC application' })
  @ApiResponse({ status: 200, description: 'KYC application reviewed successfully' })
  async reviewKyc(
    @Param('kycId') kycId: string,
    @Body() reviewData: { status: KYCStatus; remarks?: string },
    @User() user: any,
  ) {
    return this.kycService.reviewKyc(kycId, reviewData, user.id, user.role);
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'KYC service health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'kyc',
      timestamp: new Date().toISOString(),
    };
  }
}