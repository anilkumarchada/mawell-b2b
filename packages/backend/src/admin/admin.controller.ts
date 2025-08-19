import { AdminService } from '@/admin/admin.service';
import { UserRole } from '@mawell/shared';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@User() user: any) {
    return this.adminService.getDashboardData(user.id);
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved successfully' })
  async getAnalytics(
    @User() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getAnalytics(user.id, startDate, endDate);
  }

  @Get('system-health')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  async getSystemHealth(@User() user: any) {
    return this.adminService.getSystemHealth(user.id);
  }

  @Post('maintenance-mode')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle maintenance mode' })
  @ApiResponse({ status: 200, description: 'Maintenance mode toggled successfully' })
  async toggleMaintenanceMode(
    @User() user: any,
    @Body('enabled') enabled: boolean,
  ) {
    return this.adminService.toggleMaintenanceMode(enabled, user.id);
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Admin service health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'admin',
      timestamp: new Date().toISOString(),
    };
  }
}