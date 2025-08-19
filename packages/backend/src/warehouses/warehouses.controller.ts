import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '@mawell/shared';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsUUID,
  Min,
  Max,
  IsInt,
  IsLatitude,
  IsLongitude,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTOs
export class CreateWarehouseRequestDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Length(2, 20)
  @Matches(/^[A-Z0-9]+$/, { message: 'Warehouse code must contain only uppercase letters and numbers' })
  code: string;

  @IsString()
  @Length(10, 200)
  address: string;

  @IsString()
  @Length(2, 50)
  city: string;

  @IsString()
  @Length(2, 50)
  state: string;

  @IsString()
  @Matches(/^[1-9][0-9]{5}$/, { message: 'Invalid pincode format' })
  pincode: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsString()
  @Length(2, 100)
  contactPerson: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid phone number format' })
  contactPhone: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWarehouseRequestDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  @Matches(/^[A-Z0-9]+$/, { message: 'Warehouse code must contain only uppercase letters and numbers' })
  code?: string;

  @IsOptional()
  @IsString()
  @Length(10, 200)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  state?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[1-9][0-9]{5}$/, { message: 'Invalid pincode format' })
  pincode?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid phone number format' })
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignOpsUserRequestDto {
  @IsUUID()
  opsUserId: string;
}

export class WarehouseFiltersDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

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
  @IsString()
  sortBy?: 'name' | 'city' | 'createdAt' | 'updatedAt' = 'name';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class InventoryFiltersDto {
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
}

@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesController {
  private readonly logger = new Logger(WarehousesController.name);

  constructor(private readonly warehousesService: WarehousesService) {}

  /**
   * Create warehouse
   */
  @Post()
  @Roles(UserRole.ADMIN)
  async createWarehouse(
    @Body() createWarehouseDto: CreateWarehouseRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Creating warehouse: ${createWarehouseDto.name}`);
    return this.warehousesService.createWarehouse(
      createWarehouseDto,
      user.id,
      user.role,
    );
  }

  /**
   * Get all warehouses
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getWarehouses(
    @Query() filters: WarehouseFiltersDto,
    @User() user: any,
  ) {
    this.logger.log(`Getting warehouses for ${user.role} user ${user.id}`);
    return this.warehousesService.findWarehouses(
      filters,
      user.id,
      user.role,
    );
  }

  /**
   * Get active warehouses (public for buyers to see available warehouses)
   */
  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.OPS, UserRole.BUYER)
  async getActiveWarehouses(
    @Query() filters: WarehouseFiltersDto,
    @User() user: any,
  ) {
    this.logger.log(`Getting active warehouses for user ${user.id}`);
    const activeFilters = {
      ...filters,
      isActive: true,
    };
    return this.warehousesService.findWarehouses(
      activeFilters,
      user.id,
      user.role,
    );
  }

  /**
   * Get warehouse by ID
   */
  @Get(':warehouseId')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getWarehouseById(
    @Param('warehouseId') warehouseId: string,
    @User() user: any,
  ) {
    this.logger.log(`Getting warehouse ${warehouseId} for user ${user.id}`);
    return this.warehousesService.findWarehouseById(
      warehouseId,
      user.id,
      user.role,
    );
  }

  /**
   * Update warehouse
   */
  @Put(':warehouseId')
  @Roles(UserRole.ADMIN)
  async updateWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Body() updateWarehouseDto: UpdateWarehouseRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Updating warehouse ${warehouseId}`);
    return this.warehousesService.updateWarehouse(
      warehouseId,
      updateWarehouseDto,
      user.id,
      user.role,
    );
  }

  /**
   * Delete warehouse
   */
  @Delete(':warehouseId')
  @Roles(UserRole.ADMIN)
  async deleteWarehouse(
    @Param('warehouseId') warehouseId: string,
    @User() user: any,
  ) {
    this.logger.log(`Deleting warehouse ${warehouseId}`);
    return this.warehousesService.deleteWarehouse(
      warehouseId,
      user.id,
      user.role,
    );
  }

  // OPS User Assignment

  /**
   * Assign OPS user to warehouse
   */
  @Post(':warehouseId/ops-users')
  @Roles(UserRole.ADMIN)
  async assignOpsUser(
    @Param('warehouseId') warehouseId: string,
    @Body() assignOpsUserDto: AssignOpsUserRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Assigning OPS user ${assignOpsUserDto.opsUserId} to warehouse ${warehouseId}`);
    return this.warehousesService.assignOpsUser(
      warehouseId,
      assignOpsUserDto,
      user.id,
      user.role,
    );
  }

  /**
   * Remove OPS user from warehouse
   */
  @Delete(':warehouseId/ops-users/:opsUserId')
  @Roles(UserRole.ADMIN)
  async removeOpsUser(
    @Param('warehouseId') warehouseId: string,
    @Param('opsUserId') opsUserId: string,
    @User() user: any,
  ) {
    this.logger.log(`Removing OPS user ${opsUserId} from warehouse ${warehouseId}`);
    return this.warehousesService.removeOpsUser(
      warehouseId,
      opsUserId,
      user.id,
      user.role,
    );
  }

  // Inventory Management

  /**
   * Get warehouse inventory
   */
  @Get(':warehouseId/inventory')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getWarehouseInventory(
    @Param('warehouseId') warehouseId: string,
    @Query() filters: InventoryFiltersDto,
    @User() user: any,
  ) {
    this.logger.log(`Getting inventory for warehouse ${warehouseId}`);
    return this.warehousesService.getWarehouseInventory(
      warehouseId,
      user.id,
      user.role,
      filters.page,
      filters.limit,
      filters.search,
    );
  }

  /**
   * Get warehouse statistics
   */
  @Get(':warehouseId/stats')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getWarehouseStats(
    @Param('warehouseId') warehouseId: string,
    @User() user: any,
  ) {
    this.logger.log(`Getting statistics for warehouse ${warehouseId}`);
    return this.warehousesService.getWarehouseStats(
      warehouseId,
      user.id,
      user.role,
    );
  }

  // Public endpoints for basic warehouse info

  /**
   * Get warehouse locations (public for delivery address validation)
   */
  @Get('public/locations')
  @Public()
  async getWarehouseLocations() {
    this.logger.log('Getting public warehouse locations');
    const result = await this.warehousesService.findWarehouses({
      isActive: true,
      limit: 1000, // Get all active warehouses
    });
    
    // Return only basic location info
    return {
      items: result.items.map(warehouse => ({
        id: warehouse.id,
        name: warehouse.name,
        city: warehouse.city,
        state: warehouse.state,
        pincode: warehouse.pincode,
        latitude: warehouse.latitude,
        longitude: warehouse.longitude,
      })),
      total: result.total,
    };
  }

  /**
   * Get warehouses by city (public)
   */
  @Get('public/cities/:city')
  @Public()
  async getWarehousesByCity(
    @Param('city') city: string,
  ) {
    this.logger.log(`Getting warehouses for city: ${city}`);
    const result = await this.warehousesService.findWarehouses({
      city,
      isActive: true,
      limit: 100,
    });
    
    // Return only basic info
    return {
      items: result.items.map(warehouse => ({
        id: warehouse.id,
        name: warehouse.name,
        city: warehouse.city,
        state: warehouse.state,
        pincode: warehouse.pincode,
      })),
      total: result.total,
    };
  }

  /**
   * Health check
   */
  @Get('health/check')
  @Public()
  async healthCheck() {
    return {
      service: 'Warehouses Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}