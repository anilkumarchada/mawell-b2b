import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
  ParseBoolPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum, IsNumber, Min, Max, IsIn } from 'class-validator';

import { UsersService, UpdateProfileDto, AddAddressDto, UpdateAddressDto, UpdateLocationDto } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { UserRole, KYCStatus, Language } from '@mawell/shared';

// DTOs
class UpdateProfileRequestDto implements UpdateProfileDto {
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

class AddAddressRequestDto implements AddAddressDto {
  @IsIn(['HOME', 'OFFICE', 'WAREHOUSE'])
  type: 'HOME' | 'OFFICE' | 'WAREHOUSE';

  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  pincode: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

class UpdateAddressRequestDto implements UpdateAddressDto {
  @IsOptional()
  @IsIn(['HOME', 'OFFICE', 'WAREHOUSE'])
  type?: 'HOME' | 'OFFICE' | 'WAREHOUSE';

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

class UpdateLocationRequestDto implements UpdateLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@User() user: any) {
    return this.usersService.findById(user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Body(ValidationPipe) updateData: UpdateProfileRequestDto,
    @User() user: any,
  ) {
    return this.usersService.updateProfile(
      user.id,
      updateData,
      user.id,
      user.role,
    );
  }

  @Put(':id/profile')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user profile (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateData: UpdateProfileRequestDto,
    @User() user: any,
  ) {
    return this.usersService.updateProfile(
      id,
      updateData,
      user.id,
      user.role,
    );
  }

  @Post('addresses')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Add address (Buyer only)' })
  @ApiResponse({ status: 201, description: 'Address added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Buyer access required' })
  async addAddress(
    @Body(ValidationPipe) addressData: AddAddressRequestDto,
    @User() user: any,
  ) {
    return this.usersService.addAddress(
      user.id,
      addressData,
      user.id,
      user.role,
    );
  }

  @Post(':id/addresses')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add address for user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 201, description: 'Address added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async addAddressForUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) addressData: AddAddressRequestDto,
    @User() user: any,
  ) {
    return this.usersService.addAddress(
      id,
      addressData,
      user.id,
      user.role,
    );
  }

  @Put('addresses/:addressId')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Update address (Buyer only)' })
  @ApiParam({ name: 'addressId', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Buyer access required' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body(ValidationPipe) updateData: UpdateAddressRequestDto,
    @User() user: any,
  ) {
    return this.usersService.updateAddress(
      user.id,
      addressId,
      updateData,
      user.id,
      user.role,
    );
  }

  @Put(':id/addresses/:addressId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user address (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiParam({ name: 'addressId', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateUserAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body(ValidationPipe) updateData: UpdateAddressRequestDto,
    @User() user: any,
  ) {
    return this.usersService.updateAddress(
      id,
      addressId,
      updateData,
      user.id,
      user.role,
    );
  }

  @Delete('addresses/:addressId')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Delete address (Buyer only)' })
  @ApiParam({ name: 'addressId', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Buyer access required' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async deleteAddress(
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @User() user: any,
  ) {
    return this.usersService.deleteAddress(
      user.id,
      addressId,
      user.id,
      user.role,
    );
  }

  @Delete(':id/addresses/:addressId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user address (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiParam({ name: 'addressId', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async deleteUserAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @User() user: any,
  ) {
    return this.usersService.deleteAddress(
      id,
      addressId,
      user.id,
      user.role,
    );
  }

  @Put('location')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Update driver location (Driver only)' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid coordinates' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Driver access required' })
  async updateLocation(
    @Body(ValidationPipe) locationData: UpdateLocationRequestDto,
    @User() user: any,
  ) {
    return this.usersService.updateDriverLocation(
      user.id,
      locationData,
      user.id,
      user.role,
    );
  }

  @Put(':id/location')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update driver location (Admin only)' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid coordinates' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async updateDriverLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) locationData: UpdateLocationRequestDto,
    @User() user: any,
  ) {
    return this.usersService.updateDriverLocation(
      id,
      locationData,
      user.id,
      user.role,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get users list (Admin only)' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by user role' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'kycStatus', required: false, enum: KYCStatus, description: 'Filter by KYC status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by phone number' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Users list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getUsers(
    @User() user: any,
    @Query('role') role?: UserRole,
    @Query('isActive', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) isActive?: boolean,
    @Query('kycStatus') kycStatus?: KYCStatus,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.usersService.getUsers(
      {
        role,
        isActive,
        kycStatus,
        search,
        page,
        limit,
      },
      user.role,
    );
  }

  @Put(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: any,
  ) {
    return this.usersService.deactivateUser(id, user.id, user.role);
  }

  @Put(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async activateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: any,
  ) {
    return this.usersService.activateUser(id, user.id, user.role);
  }

  @Get('health')
  @ApiOperation({ summary: 'Users service health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'users',
      timestamp: new Date().toISOString(),
    };
  }
}