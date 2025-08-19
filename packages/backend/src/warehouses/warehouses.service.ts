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
import { UserRole } from '@mawell/shared';

export interface CreateWarehouseDto {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  capacity?: number;
  isActive?: boolean;
}

export interface UpdateWarehouseDto {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  capacity?: number;
  isActive?: boolean;
}

export interface WarehouseFilters {
  city?: string;
  state?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'city' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AssignOpsUserDto {
  opsUserId: string;
}

@Injectable()
export class WarehousesService {
  private readonly logger = new Logger(WarehousesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private validationService: ValidationService,
  ) {}

  /**
   * Create warehouse
   */
  async createWarehouse(
    warehouseData: CreateWarehouseDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create warehouses');
    }

    // Validate pincode
    if (!this.validationService.validatePincode(warehouseData.pincode)) {
      throw new BadRequestException('Invalid pincode');
    }

    // Validate phone number
    if (!this.validationService.validatePhoneNumber(warehouseData.contactPhone)) {
      throw new BadRequestException('Invalid contact phone number');
    }

    // Validate email if provided
    if (warehouseData.contactEmail && !this.validationService.validateEmail(warehouseData.contactEmail)) {
      throw new BadRequestException('Invalid contact email');
    }

    // Validate coordinates if provided
    if (warehouseData.latitude && warehouseData.longitude) {
      if (!this.validationService.validateCoordinates(warehouseData.latitude, warehouseData.longitude)) {
        throw new BadRequestException('Invalid coordinates');
      }
    }

    // Check if warehouse code already exists
    const existingWarehouse = await this.prisma.warehouse.findUnique({
      where: { code: warehouseData.code },
    });
    if (existingWarehouse) {
      throw new BadRequestException('Warehouse code already exists');
    }

    const warehouse = await this.prisma.warehouse.create({
      data: {
        ...warehouseData,
        isActive: warehouseData.isActive ?? true,
      },
    });

    // Log audit trail
    await this.auditService.logCreate(
      'WAREHOUSE',
      warehouse.id,
      warehouseData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Warehouse created: ${warehouse.name} (${warehouse.code})`);

    return warehouse;
  }

  /**
   * Get warehouse by ID
   */
  async findWarehouseById(
    warehouseId: string,
    requestingUserId?: string,
    requestingUserRole?: UserRole,
  ): Promise<any> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        warehouseOpsUser: {
          include: {
            opsUser: {
              select: {
                id: true,
                phone: true,
                name: true,
              },
            },
          },
        },
        inventory: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
              },
            },
          },
          orderBy: {
            product: {
              name: 'asc',
            },
          },
        },
        _count: {
          select: {
            inventory: true,
            consignments: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Check permissions for OPS users
    if (requestingUserRole === UserRole.OPS && requestingUserId) {
      const hasAccess = (warehouse as any).warehouseOpsUser?.some(
        (assignment: any) => assignment.opsUserId === requestingUserId
      ) || false;
      if (!hasAccess) {
        throw new ForbiddenException('You can only view warehouses assigned to you');
      }
    }

    return warehouse;
  }

  /**
   * Get warehouses with filters
   */
  async findWarehouses(
    filters: WarehouseFilters = {},
    requestingUserId?: string,
    requestingUserRole?: UserRole,
  ) {
    const {
      city,
      state,
      isActive,
      search,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = filters;

    const { page: validPage, limit: validLimit } = this.validationService.validatePagination(page, limit);

    const where: any = {};

    // Role-based filtering
    if (requestingUserRole === UserRole.OPS && requestingUserId) {
      // OPS users can only see their assigned warehouses
      where.warehouseOpsUser = {
        some: {
          opsUserId: requestingUserId,
        },
      };
    }

    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search } },
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [warehouses, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        include: {
          warehouseOpsUser: {
            include: {
              opsUser: {
                select: {
                  id: true,
                  phone: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              inventory: true,
              consignments: true,
            },
          },
        },
        orderBy,
        skip: (validPage - 1) * validLimit,
        take: validLimit,
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return {
      items: warehouses,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  /**
   * Update warehouse
   */
  async updateWarehouse(
    warehouseId: string,
    updateData: UpdateWarehouseDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update warehouses');
    }

    const warehouse = await this.findWarehouseById(warehouseId);
    const oldValues = {
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      city: warehouse.city,
      state: warehouse.state,
      pincode: warehouse.pincode,
      contactPerson: warehouse.contactPerson,
      contactPhone: warehouse.contactPhone,
      contactEmail: warehouse.contactEmail,
      isActive: warehouse.isActive,
    };

    // Validate pincode if provided
    if (updateData.pincode && !this.validationService.validatePincode(updateData.pincode)) {
      throw new BadRequestException('Invalid pincode');
    }

    // Validate phone number if provided
    if (updateData.contactPhone && !this.validationService.validatePhoneNumber(updateData.contactPhone)) {
      throw new BadRequestException('Invalid contact phone number');
    }

    // Validate email if provided
    if (updateData.contactEmail && !this.validationService.validateEmail(updateData.contactEmail)) {
      throw new BadRequestException('Invalid contact email');
    }

    // Validate coordinates if provided
    if (updateData.latitude && updateData.longitude) {
      if (!this.validationService.validateCoordinates(updateData.latitude, updateData.longitude)) {
        throw new BadRequestException('Invalid coordinates');
      }
    }

    // Check if warehouse code already exists (if being updated)
    if (updateData.code && updateData.code !== warehouse.code) {
      const existingWarehouse = await this.prisma.warehouse.findUnique({
        where: { code: updateData.code },
      });
      if (existingWarehouse) {
        throw new BadRequestException('Warehouse code already exists');
      }
    }

    const updatedWarehouse = await this.prisma.warehouse.update({
      where: { id: warehouseId },
      data: updateData,
    });

    // Log audit trail
    await this.auditService.logUpdate(
      'WAREHOUSE',
      warehouseId,
      oldValues,
      updateData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Warehouse updated: ${updatedWarehouse.name} (${updatedWarehouse.code})`);

    return this.findWarehouseById(warehouseId);
  }

  /**
   * Delete warehouse (soft delete)
   */
  async deleteWarehouse(
    warehouseId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete warehouses');
    }

    const warehouse = await this.findWarehouseById(warehouseId);

    // Check if warehouse has active inventory
    const inventoryCount = await this.prisma.inventory.count({
      where: {
        warehouseId,
        quantity: {
          gt: 0,
        },
      },
    });

    if (inventoryCount > 0) {
      throw new BadRequestException('Cannot delete warehouse with active inventory');
    }

    // Check if warehouse has pending consignments
    const pendingConsignments = await this.prisma.consignment.count({
      where: {
        warehouseId,
        status: {
          notIn: ['DELIVERED', 'CANCELLED'],
        },
      },
    });

    if (pendingConsignments > 0) {
      throw new BadRequestException('Cannot delete warehouse with pending consignments');
    }

    // Soft delete by setting isActive to false
    await this.prisma.warehouse.update({
      where: { id: warehouseId },
      data: {
        isActive: false,
      },
    });

    // Log audit trail
    await this.auditService.logDelete(
      'WAREHOUSE',
      warehouseId,
      warehouse,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Warehouse deleted: ${warehouse.name} (${warehouse.code})`);

    return { message: 'Warehouse deleted successfully' };
  }

  /**
   * Assign OPS user to warehouse
   */
  async assignOpsUser(
    warehouseId: string,
    assignData: AssignOpsUserDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can assign OPS users to warehouses');
    }

    // Verify warehouse exists
    await this.findWarehouseById(warehouseId);

    // Verify OPS user exists
    const opsUser = await this.prisma.user.findUnique({
      where: {
        id: assignData.opsUserId,
        role: UserRole.OPS,
        isActive: true,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
    if (!opsUser) {
      throw new BadRequestException('OPS user not found or inactive');
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.warehouseOpsUser.findUnique({
      where: {
        warehouseId_opsUserId: {
          warehouseId,
          opsUserId: assignData.opsUserId,
        },
      },
    });
    if (existingAssignment) {
      throw new BadRequestException('OPS user is already assigned to this warehouse');
    }

    const assignment = await this.prisma.warehouseOpsUser.create({
      data: {
        opsUserId: assignData.opsUserId,
        warehouseId,
      },
      include: {
        opsUser: {
          select: {
            id: true,
            phone: true,
            name: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Log audit trail
    await this.auditService.logCreate(
      'OPS_WAREHOUSE_ASSIGNMENT',
      assignment.opsUserId + '_' + assignment.warehouseId,
      assignData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`OPS user ${assignData.opsUserId} assigned to warehouse ${warehouseId}`);

    return assignment;
  }

  /**
   * Remove OPS user from warehouse
   */
  async removeOpsUser(
    warehouseId: string,
    opsUserId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can remove OPS users from warehouses');
    }

    // Verify assignment exists
    const assignment = await this.prisma.warehouseOpsUser.findUnique({
      where: {
        warehouseId_opsUserId: {
          warehouseId,
          opsUserId,
        },
      },
      include: {
        opsUser: {
          select: {
            phone: true,
            name: true,
          },
        },
        warehouse: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    await this.prisma.warehouseOpsUser.delete({
      where: {
        warehouseId_opsUserId: {
          warehouseId,
          opsUserId,
        },
      },
    });

    // Log audit trail
    await this.auditService.logDelete(
      'OPS_WAREHOUSE_ASSIGNMENT',
      opsUserId + '_' + warehouseId,
      assignment,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`OPS user ${opsUserId} removed from warehouse ${warehouseId}`);

    return { message: 'OPS user removed from warehouse successfully' };
  }

  /**
   * Get warehouse inventory
   */
  async getWarehouseInventory(
    warehouseId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    // Check permissions
    if (requestingUserRole === UserRole.OPS) {
      await this.findWarehouseById(warehouseId, requestingUserId, requestingUserRole);
      // findWarehouseById already checks OPS permissions
    } else if (![UserRole.ADMIN].includes(requestingUserRole)) {
      throw new ForbiddenException('Insufficient permissions to view warehouse inventory');
    }

    const { page: validPage, limit: validLimit } = this.validationService.validatePagination(page, limit);

    const where: any = {
      warehouseId,
    };

    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [inventory, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          product: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              brand: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          product: {
            name: 'asc',
          },
        },
        skip: (validPage - 1) * validLimit,
        take: validLimit,
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return {
      items: inventory,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  /**
   * Get warehouse statistics
   */
  async getWarehouseStats(
    warehouseId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (requestingUserRole === UserRole.OPS) {
      await this.findWarehouseById(warehouseId, requestingUserId, requestingUserRole);
    } else if (![UserRole.ADMIN].includes(requestingUserRole)) {
      throw new ForbiddenException('Insufficient permissions to view warehouse statistics');
    }

    const [inventoryStats, consignmentStats] = await Promise.all([
      this.prisma.inventory.aggregate({
        where: { warehouseId },
        _count: { _all: true },
        _sum: {
          quantity: true,
          reservedQuantity: true,
        },
      }),
      this.prisma.consignment.groupBy({
        by: ['status'],
        where: { warehouseId },
        _count: { _all: true },
      }),
    ]);

    const consignmentsByStatus = consignmentStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count._all;
      return acc;
    }, {} as Record<string, number>);

    return {
      inventory: {
        totalProducts: inventoryStats._count._all,
        totalQuantity: inventoryStats._sum.quantity || 0,
        reservedQuantity: inventoryStats._sum.reservedQuantity || 0,
        availableQuantity: (inventoryStats._sum.quantity || 0) - (inventoryStats._sum.reservedQuantity || 0),
      },
      consignments: consignmentsByStatus,
    };
  }
}