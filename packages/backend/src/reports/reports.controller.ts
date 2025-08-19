import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ReportsService, DateRangeDto } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '@mawell/shared';
import {
  IsDateString,
  IsOptional,
  IsUUID,
  IsString,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

// DTOs
export class DateRangeQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @Transform(({ value }) => new Date(value))
  get startDateObj(): Date {
    return new Date(this.startDate);
  }

  @Transform(({ value }) => new Date(value))
  get endDateObj(): Date {
    return new Date(this.endDate);
  }
}

export class ReportQueryDto {
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Get dashboard statistics
   */
  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getDashboardStats(
    @User() user: any,
  ) {
    this.logger.log(`Getting dashboard stats for ${user.role} user ${user.id}`);
    return this.reportsService.getDashboardStats(user.id, user.role);
  }

  /**
   * Generate sales report
   */
  @Get('sales')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getSalesReport(
    @Query() query: DateRangeQueryDto,
    @User() user: any,
  ) {
    this.logger.log(`Generating sales report for ${user.role} user ${user.id}`);
    
    const dateRange: DateRangeDto = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      warehouseId: query.warehouseId,
    };

    return this.reportsService.generateSalesReport(
      dateRange,
      user.id,
      user.role,
    );
  }

  /**
   * Generate order analytics
   */
  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getOrderAnalytics(
    @Query() query: DateRangeQueryDto,
    @User() user: any,
  ) {
    this.logger.log(`Generating order analytics for ${user.role} user ${user.id}`);
    
    const dateRange: DateRangeDto = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      warehouseId: query.warehouseId,
    };

    return this.reportsService.generateOrderAnalytics(
      dateRange,
      user.id,
      user.role,
    );
  }

  /**
   * Generate inventory report
   */
  @Get('inventory')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getInventoryReport(
    @Query() query: ReportQueryDto,
    @User() user: any,
  ) {
    this.logger.log(`Generating inventory report for ${user.role} user ${user.id}`);
    
    return this.reportsService.generateInventoryReport(
      query.warehouseId,
      user.id,
      user.role,
    );
  }

  /**
   * Generate delivery performance report
   */
  @Get('delivery')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getDeliveryPerformance(
    @Query() query: DateRangeQueryDto,
    @User() user: any,
  ) {
    this.logger.log(`Generating delivery performance report for ${user.role} user ${user.id}`);
    
    const dateRange: DateRangeDto = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      warehouseId: query.warehouseId,
    };

    return this.reportsService.generateDeliveryPerformance(
      dateRange,
      user.id,
      user.role,
    );
  }

  /**
   * Get sales summary for quick overview
   */
  @Get('sales/summary')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getSalesSummary(
    @Query() query: ReportQueryDto,
    @User() user: any,
  ) {
    this.logger.log(`Getting sales summary for ${user.role} user ${user.id}`);
    
    // Default to last 30 days if no date range provided
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const dateRange: DateRangeDto = {
      startDate,
      endDate,
      warehouseId: query.warehouseId,
    };

    const salesReport = await this.reportsService.generateSalesReport(
      dateRange,
      user.id,
      user.role,
    );

    // Return summarized data
    return {
      totalOrders: salesReport.totalOrders,
      totalRevenue: salesReport.totalRevenue,
      averageOrderValue: salesReport.averageOrderValue,
      topProducts: salesReport.topProducts.slice(0, 5),
      topBuyers: salesReport.topBuyers.slice(0, 5),
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    };
  }

  /**
   * Get order trends for charts
   */
  @Get('orders/trends')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getOrderTrends(
    @Query() query: DateRangeQueryDto,
    @User() user: any,
  ) {
    this.logger.log(`Getting order trends for ${user.role} user ${user.id}`);
    
    const dateRange: DateRangeDto = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      warehouseId: query.warehouseId,
    };

    const analytics = await this.reportsService.generateOrderAnalytics(
      dateRange,
      user.id,
      user.role,
    );

    return {
      orderTrends: analytics.orderTrends,
      ordersByStatus: analytics.ordersByStatus,
      ordersByPaymentStatus: analytics.ordersByPaymentStatus,
      averageDeliveryTime: analytics.averageDeliveryTime,
    };
  }

  /**
   * Get inventory alerts
   */
  @Get('inventory/alerts')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getInventoryAlerts(
    @Query() query: ReportQueryDto,
    @User() user: any,
  ) {
    this.logger.log(`Getting inventory alerts for ${user.role} user ${user.id}`);
    
    const report = await this.reportsService.generateInventoryReport(
      query.warehouseId,
      user.id,
      user.role,
    );

    return {
      lowStockProducts: report.lowStockProducts,
      totalLowStockItems: report.lowStockProducts.length,
      warehouseInventory: report.warehouseInventory,
    };
  }

  /**
   * Get delivery metrics
   */
  @Get('delivery/metrics')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getDeliveryMetrics(
    @Query() query: DateRangeQueryDto,
    @User() user: any,
  ) {
    this.logger.log(`Getting delivery metrics for ${user.role} user ${user.id}`);
    
    const dateRange: DateRangeDto = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      warehouseId: query.warehouseId,
    };

    const performance = await this.reportsService.generateDeliveryPerformance(
      dateRange,
      user.id,
      user.role,
    );

    return {
      totalConsignments: performance.totalConsignments,
      averageDeliveryTime: performance.averageDeliveryTime,
      onTimeDeliveryRate: performance.onTimeDeliveryRate,
      consignmentsByStatus: performance.consignmentsByStatus,
      topPerformingDrivers: performance.topPerformingDrivers.slice(0, 5),
    };
  }

  /**
   * Export sales report (returns data for CSV/Excel export)
   */
  @Get('sales/export')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async exportSalesReport(
    @Query() query: DateRangeQueryDto,
    @User() user: any,
  ) {
    this.logger.log(`Exporting sales report for ${user.role} user ${user.id}`);
    
    const dateRange: DateRangeDto = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      warehouseId: query.warehouseId,
    };

    const report = await this.reportsService.generateSalesReport(
      dateRange,
      user.id,
      user.role,
    );

    // Format data for export
    return {
      summary: {
        totalOrders: report.totalOrders,
        totalRevenue: report.totalRevenue,
        averageOrderValue: report.averageOrderValue,
        period: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
      },
      dailySales: report.dailySales,
      topProducts: report.topProducts,
      topBuyers: report.topBuyers,
      exportedAt: new Date().toISOString(),
      exportedBy: user.id,
    };
  }

  /**
   * Export inventory report
   */
  @Get('inventory/export')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async exportInventoryReport(
    @Query() query: ReportQueryDto,
    @User() user: any,
  ) {
    this.logger.log(`Exporting inventory report for ${user.role} user ${user.id}`);
    
    const report = await this.reportsService.generateInventoryReport(
      query.warehouseId,
      user.id,
      user.role,
    );

    return {
      summary: {
        totalProducts: report.totalProducts,
        totalInventoryValue: report.totalInventoryValue,
        lowStockItemsCount: report.lowStockProducts.length,
      },
      warehouseInventory: report.warehouseInventory,
      lowStockProducts: report.lowStockProducts,
      exportedAt: new Date().toISOString(),
      exportedBy: user.id,
    };
  }

  /**
   * Health check
   */
  @Get('health/check')
  @Public()
  async healthCheck() {
    return {
      service: 'Reports Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}