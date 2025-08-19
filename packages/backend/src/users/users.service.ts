import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { ValidationService } from '../common/services/validation.service';
import { UserRole, KYCStatus, Language } from '@mawell/shared';

export interface UpdateProfileDto {
  language?: Language;
  // Buyer profile updates
  businessName?: string;
  gstin?: string;
  // Driver profile updates
  licenseNumber?: string;
  vehicleNumber?: string;
  isAvailable?: boolean;
}

export interface AddAddressDto {
  type: 'HOME' | 'OFFICE' | 'WAREHOUSE';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface UpdateAddressDto extends Partial<AddAddressDto> {}

export interface UpdateLocationDto {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private validationService: ValidationService,
  ) {}

  /**
   * Get user by ID with profile
   */
  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: true,
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        driverProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check if user can update this profile
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.findById(userId);
    const oldValues = { ...user };

    // Validate GSTIN if provided
    if (updateData.gstin) {
      const gstinValidation = this.validationService.validateGSTIN(updateData.gstin);
      if (!gstinValidation.isValid) {
        throw new BadRequestException(gstinValidation.error);
      }
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // Update user basic info
      const userUpdate: any = {};
      if (updateData.language) {
        userUpdate.language = updateData.language;
      }

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdate,
        });
      }

      // Update role-specific profile
      if (user.role === UserRole.BUYER && user.buyerProfile) {
        const buyerUpdate: any = {};
        if (updateData.businessName !== undefined) {
          buyerUpdate.businessName = updateData.businessName;
        }
        if (updateData.gstin !== undefined) {
          buyerUpdate.gstin = updateData.gstin;
        }

        if (Object.keys(buyerUpdate).length > 0) {
          await tx.buyerProfile.update({
            where: { userId },
            data: buyerUpdate,
          });
        }
      }

      if (user.role === UserRole.DRIVER && user.driverProfile) {
        const driverUpdate: any = {};
        if (updateData.licenseNumber !== undefined) {
          driverUpdate.licenseNumber = updateData.licenseNumber;
        }
        if (updateData.vehicleNumber !== undefined) {
          driverUpdate.vehicleNumber = updateData.vehicleNumber;
        }
        if (updateData.isAvailable !== undefined) {
          driverUpdate.isAvailable = updateData.isAvailable;
        }

        if (Object.keys(driverUpdate).length > 0) {
          await tx.driverProfile.update({
            where: { userId },
            data: driverUpdate,
          });
        }
      }

      return this.findById(userId);
    });

    // Log audit trail
    await this.auditService.logUpdate(
      'USER_PROFILE',
      userId,
      oldValues,
      updateData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Profile updated for user ${userId}`);

    return updatedUser;
  }

  /**
   * Add address for buyer
   */
  async addAddress(
    userId: string,
    addressData: AddAddressDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only add addresses to your own profile');
    }

    const user = await this.findById(userId);
    
    if (user.role !== UserRole.BUYER || !user.buyerProfile) {
      throw new BadRequestException('Only buyers can have addresses');
    }

    // Validate pincode
    const pincodeValidation = this.validationService.validatePincode(addressData.pincode);
    if (!pincodeValidation.isValid) {
      throw new BadRequestException(pincodeValidation.error);
    }

    // Validate coordinates if provided
    if (addressData.latitude && addressData.longitude) {
      const coordValidation = this.validationService.validateCoordinates(
        addressData.latitude,
        addressData.longitude,
      );
      if (!coordValidation.isValid) {
        throw new BadRequestException(coordValidation.error);
      }
    }

    const address = await this.prisma.$transaction(async (tx) => {
      // If this is set as default, unset other default addresses
      if (addressData.isDefault) {
        await tx.address.updateMany({
          where: {
            userId: user.id,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      // Create new address
      return tx.address.create({
        data: {
          userId: user.id,
          line1: addressData.addressLine1,
          line2: addressData.addressLine2,
          city: addressData.city,
          state: addressData.state,
          pincode: addressData.pincode,
          latitude: addressData.latitude,
          longitude: addressData.longitude,
          isDefault: addressData.isDefault || false,
        },
      });
    });

    // Log audit trail
    await this.auditService.logCreate(
      'ADDRESS',
      address.id,
      addressData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Address added for user ${userId}`);

    return address;
  }

  /**
   * Update address
   */
  async updateAddress(
    userId: string,
    addressId: string,
    updateData: UpdateAddressDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own addresses');
    }

    const user = await this.findById(userId);
    
    if (user.role !== UserRole.BUYER || !user.buyerProfile) {
      throw new BadRequestException('Only buyers can have addresses');
    }

    // Find address
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.id,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Validate pincode if provided
    if (updateData.pincode) {
      const pincodeValidation = this.validationService.validatePincode(updateData.pincode);
      if (!pincodeValidation.isValid) {
        throw new BadRequestException(pincodeValidation.error);
      }
    }

    // Validate coordinates if provided
    if (updateData.latitude && updateData.longitude) {
      const coordValidation = this.validationService.validateCoordinates(
        updateData.latitude,
        updateData.longitude,
      );
      if (!coordValidation.isValid) {
        throw new BadRequestException(coordValidation.error);
      }
    }

    const oldValues = { ...address };

    const updatedAddress = await this.prisma.$transaction(async (tx) => {
      // If this is set as default, unset other default addresses
      if (updateData.isDefault) {
        await tx.address.updateMany({
          where: {
            userId: user.id,
            isDefault: true,
            id: { not: addressId },
          },
          data: { isDefault: false },
        });
      }

      // Update address
      const mappedData: any = {};
      if (updateData.addressLine1 !== undefined) mappedData.line1 = updateData.addressLine1;
      if (updateData.addressLine2 !== undefined) mappedData.line2 = updateData.addressLine2;
      if (updateData.city !== undefined) mappedData.city = updateData.city;
      if (updateData.state !== undefined) mappedData.state = updateData.state;
      if (updateData.pincode !== undefined) mappedData.pincode = updateData.pincode;
      if (updateData.latitude !== undefined) mappedData.latitude = updateData.latitude;
      if (updateData.longitude !== undefined) mappedData.longitude = updateData.longitude;
      if (updateData.isDefault !== undefined) mappedData.isDefault = updateData.isDefault;
      
      return tx.address.update({
        where: { id: addressId },
        data: mappedData,
      });
    });

    // Log audit trail
    await this.auditService.logUpdate(
      'ADDRESS',
      addressId,
      oldValues,
      updateData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Address ${addressId} updated for user ${userId}`);

    return updatedAddress;
  }

  /**
   * Delete address
   */
  async deleteAddress(
    userId: string,
    addressId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own addresses');
    }

    const user = await this.findById(userId);
    
    if (user.role !== UserRole.BUYER || !user.buyerProfile) {
      throw new BadRequestException('Only buyers can have addresses');
    }

    // Find address
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.id,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const oldValues = { ...address };

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    // Log audit trail
    await this.auditService.logDelete(
      'ADDRESS',
      addressId,
      oldValues,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Address ${addressId} deleted for user ${userId}`);

    return { message: 'Address deleted successfully' };
  }

  /**
   * Update driver location
   */
  async updateDriverLocation(
    userId: string,
    locationData: UpdateLocationDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own location');
    }

    const user = await this.findById(userId);
    
    if (user.role !== UserRole.DRIVER || !user.driverProfile) {
      throw new BadRequestException('Only drivers can update location');
    }

    // Validate coordinates
    const coordValidation = this.validationService.validateCoordinates(
      locationData.latitude,
      locationData.longitude,
    );
    if (!coordValidation.isValid) {
      throw new BadRequestException(coordValidation.error);
    }

    const updatedProfile = await this.prisma.driverProfile.update({
      where: { userId },
      data: {
        currentLatitude: locationData.latitude,
        currentLongitude: locationData.longitude,
        locationUpdatedAt: new Date(),
      },
    });

    this.logger.log(`Location updated for driver ${userId}`);

    return {
      latitude: updatedProfile.currentLatitude,
      longitude: updatedProfile.currentLongitude,
      lastUpdate: updatedProfile.locationUpdatedAt,
    };
  }

  /**
   * Get users list (admin only)
   */
  async getUsers(
    filters: {
      role?: UserRole;
      isActive?: boolean;
      kycStatus?: KYCStatus;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view users list');
    }

    const {
      role,
      isActive,
      kycStatus,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const { page: validPage, limit: validLimit } = this.validationService.validatePagination(page, limit);

    const where: any = {};

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.phone = {
        contains: search,
      };
    }

    // Add KYC status filter for buyers and drivers
    if (kycStatus && (role === UserRole.BUYER || role === UserRole.DRIVER)) {
      if (role === UserRole.BUYER) {
        where.buyerProfile = {
          kycStatus,
        };
      } else if (role === UserRole.DRIVER) {
        where.driverProfile = {
          kycStatus,
        };
      }
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          buyerProfile: {
            select: {
              shopName: true,
              gstin: true,
              kycStatus: true,
            },
          },
          driverProfile: {
            select: {
              licenseNumber: true,
              vehicleNumber: true,
              isAvailable: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (validPage - 1) * validLimit,
        take: validLimit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  /**
   * Deactivate user (admin only)
   */
  async deactivateUser(
    userId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can deactivate users');
    }

    const user = await this.findById(userId);
    const oldValues = { isActive: user.isActive };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Log audit trail
    await this.auditService.logUpdate(
      'USER',
      userId,
      oldValues,
      { isActive: false },
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`User ${userId} deactivated by admin ${requestingUserId}`);

    return updatedUser;
  }

  /**
   * Activate user (admin only)
   */
  async activateUser(
    userId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can activate users');
    }

    const user = await this.findById(userId);
    const oldValues = { isActive: user.isActive };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    // Log audit trail
    await this.auditService.logUpdate(
      'USER',
      userId,
      oldValues,
      { isActive: true },
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`User ${userId} activated by admin ${requestingUserId}`);

    return updatedUser;
  }
}