import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole, ConsignmentStatus } from '@mawell/shared';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  Min,
  Max,
  IsInt,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTOs
export class CreateConsignmentRequestDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsDateString()
  estimatedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateConsignmentRequestDto {
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsEnum(ConsignmentStatus)
  status?: ConsignmentStatus;

  @IsOptional()
  @IsDateString()
  estimatedDeliveryDate?: string;

  @IsOptional()
  @IsDateString()
  actualDeliveryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignDriverRequestDto {
  @IsUUID()
  driverId: string;
}

export class UpdateLocationRequestDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;
}

export class ConsignmentFiltersDto {
  @IsOptional()
  @IsEnum(ConsignmentStatus)
  status?: ConsignmentStatus;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'estimatedDeliveryDate', 'actualDeliveryDate'])
  sortBy?: 'createdAt' | 'updatedAt' | 'estimatedDeliveryDate' | 'actualDeliveryDate' = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

@Controller('logistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogisticsController {
  private readonly logger = new Logger(LogisticsController.name);

  constructor(private readonly logisticsService: LogisticsService) {}

  // Consignment Management

  /**
   * Create consignment
   */
  @Post('consignments')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async createConsignment(
    @Body() createConsignmentDto: CreateConsignmentRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Creating consignment for order ${createConsignmentDto.orderId}`);
    const consignmentData = {
      ...createConsignmentDto,
      estimatedDeliveryDate: createConsignmentDto.estimatedDeliveryDate
        ? new Date(createConsignmentDto.estimatedDeliveryDate)
        : undefined,
    };
    return this.logisticsService.createConsignment(
      consignmentData,
      user.id,
      user.role,
    );
  }

  /**
   * Get all consignments
   */
  @Get('consignments')
  @Roles(UserRole.ADMIN, UserRole.OPS, UserRole.DRIVER, UserRole.BUYER)
  async getConsignments(
    @Query() filters: ConsignmentFiltersDto,
    @User() user: any,
  ) {
    this.logger.log(`Getting consignments for ${user.role} user ${user.id}`);
    const filterData = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };
    return this.logisticsService.findConsignments(filterData, user.id, user.role);
  }

  /**
   * Get consignment by ID
   */
  @Get('consignments/:consignmentId')
  @Roles(UserRole.ADMIN, UserRole.OPS, UserRole.DRIVER, UserRole.BUYER)
  async getConsignmentById(
    @Param('consignmentId') consignmentId: string,
    @User() user: any,
  ) {
    this.logger.log(`Getting consignment ${consignmentId} for user ${user.id}`);
    return this.logisticsService.findConsignmentById(
      consignmentId,
      user.id,
      user.role,
    );
  }

  /**
   * Update consignment
   */
  @Put('consignments/:consignmentId')
  @Roles(UserRole.ADMIN, UserRole.OPS, UserRole.DRIVER)
  async updateConsignment(
    @Param('consignmentId') consignmentId: string,
    @Body() updateConsignmentDto: UpdateConsignmentRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Updating consignment ${consignmentId}`);
    const updateData = {
      ...updateConsignmentDto,
      estimatedDeliveryDate: updateConsignmentDto.estimatedDeliveryDate
        ? new Date(updateConsignmentDto.estimatedDeliveryDate)
        : undefined,
      actualDeliveryDate: updateConsignmentDto.actualDeliveryDate
        ? new Date(updateConsignmentDto.actualDeliveryDate)
        : undefined,
    };
    return this.logisticsService.updateConsignment(
      consignmentId,
      updateData,
      user.id,
      user.role,
    );
  }

  /**
   * Assign driver to consignment
   */
  @Put('consignments/:consignmentId/assign-driver')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async assignDriver(
    @Param('consignmentId') consignmentId: string,
    @Body() assignDriverDto: AssignDriverRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Assigning driver ${assignDriverDto.driverId} to consignment ${consignmentId}`);
    return this.logisticsService.assignDriver(
      consignmentId,
      assignDriverDto.driverId,
      user.id,
      user.role,
    );
  }

  // Driver Management

  /**
   * Get driver's consignments
   */
  @Get('drivers/:driverId/consignments')
  @Roles(UserRole.ADMIN, UserRole.OPS, UserRole.DRIVER)
  async getDriverConsignments(
    @Param('driverId') driverId: string,
    @User() user: any,
  ) {
    this.logger.log(`Getting consignments for driver ${driverId}`);
    return this.logisticsService.getDriverConsignments(
      driverId,
      user.id,
      user.role,
    );
  }

  /**
   * Get current driver's consignments
   */
  @Get('my-consignments')
  @Roles(UserRole.DRIVER)
  async getMyConsignments(@User() user: any) {
    this.logger.log(`Getting consignments for driver ${user.id}`);
    return this.logisticsService.getDriverConsignments(
      user.id,
      user.id,
      user.role,
    );
  }

  /**
   * Update driver location
   */
  @Put('drivers/:driverId/location')
  @Roles(UserRole.ADMIN, UserRole.OPS, UserRole.DRIVER)
  async updateDriverLocation(
    @Param('driverId') driverId: string,
    @Body() updateLocationDto: UpdateLocationRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Updating location for driver ${driverId}`);
    return this.logisticsService.updateDriverLocation(
      driverId,
      updateLocationDto,
      user.id,
      user.role,
    );
  }

  /**
   * Update current driver's location
   */
  @Put('my-location')
  @Roles(UserRole.DRIVER)
  async updateMyLocation(
    @Body() updateLocationDto: UpdateLocationRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Driver ${user.id} updating their location`);
    return this.logisticsService.updateDriverLocation(
      user.id,
      updateLocationDto,
      user.id,
      user.role,
    );
  }

  // Consignment Status Updates (for drivers)

  /**
   * Mark consignment as picked up
   */
  @Put('consignments/:consignmentId/pickup')
  @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.OPS)
  async markPickedUp(
    @Param('consignmentId') consignmentId: string,
    @Body() body: { notes?: string },
    @User() user: any,
  ) {
    this.logger.log(`Marking consignment ${consignmentId} as picked up`);
    return this.logisticsService.updateConsignment(
      consignmentId,
      {
        status: ConsignmentStatus.PICKED_UP,
        notes: body.notes,
      },
      user.id,
      user.role,
    );
  }

  /**
   * Mark consignment as in transit
   */
  @Put('consignments/:consignmentId/transit')
  @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.OPS)
  async markInTransit(
    @Param('consignmentId') consignmentId: string,
    @Body() body: { notes?: string },
    @User() user: any,
  ) {
    this.logger.log(`Marking consignment ${consignmentId} as in transit`);
    return this.logisticsService.updateConsignment(
      consignmentId,
      {
        status: ConsignmentStatus.IN_TRANSIT,
        notes: body.notes,
      },
      user.id,
      user.role,
    );
  }

  /**
   * Mark consignment as delivered
   */
  @Put('consignments/:consignmentId/deliver')
  @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.OPS)
  async markDelivered(
    @Param('consignmentId') consignmentId: string,
    @Body() body: { notes?: string },
    @User() user: any,
  ) {
    this.logger.log(`Marking consignment ${consignmentId} as delivered`);
    return this.logisticsService.updateConsignment(
      consignmentId,
      {
        status: ConsignmentStatus.DELIVERED,
        actualDeliveryDate: new Date(),
        notes: body.notes,
      },
      user.id,
      user.role,
    );
  }

  /**
   * Cancel consignment
   */
  @Put('consignments/:consignmentId/cancel')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async cancelConsignment(
    @Param('consignmentId') consignmentId: string,
    @Body() body: { notes?: string },
    @User() user: any,
  ) {
    this.logger.log(`Cancelling consignment ${consignmentId}`);
    return this.logisticsService.updateConsignment(
      consignmentId,
      {
        status: ConsignmentStatus.CANCELLED,
        notes: body.notes,
      },
      user.id,
      user.role,
    );
  }

  // Tracking and Reports

  /**
   * Get consignments by order
   */
  @Get('orders/:orderId/consignments')
  @Roles(UserRole.ADMIN, UserRole.OPS, UserRole.BUYER)
  async getConsignmentsByOrder(
    @Param('orderId') orderId: string,
    @User() user: any,
  ) {
    this.logger.log(`Getting consignments for order ${orderId}`);
    return this.logisticsService.findConsignments(
      { orderId },
      user.id,
      user.role,
    );
  }

  /**
   * Get consignments by warehouse
   */
  @Get('warehouses/:warehouseId/consignments')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getConsignmentsByWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Query() filters: ConsignmentFiltersDto,
    @User() user: any,
  ) {
    this.logger.log(`Getting consignments for warehouse ${warehouseId}`);
    const filterData = {
      ...filters,
      warehouseId,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };
    return this.logisticsService.findConsignments(filterData, user.id, user.role);
  }

  /**
   * Health check
   */
  @Get('health/check')
  @Public()
  async healthCheck() {
    return {
      service: 'Logistics Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}