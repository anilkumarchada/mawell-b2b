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
import { UserRole, ConsignmentStatus, OrderStatus } from '@mawell/shared';

export interface CreateConsignmentDto {
  orderId: string;
  warehouseId: string;
  driverId?: string;
  estimatedDeliveryDate?: Date;
  notes?: string;
}

export interface UpdateConsignmentDto {
  driverId?: string;
  status?: ConsignmentStatus;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
}

export interface UpdateLocationDto {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ConsignmentFilters {
  status?: ConsignmentStatus;
  driverId?: string;
  warehouseId?: string;
  orderId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'estimatedDeliveryDate' | 'actualDeliveryDate';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private validationService: ValidationService,
  ) {}

  // Consignment Management

  /**
   * Create consignment for order
   */
  async createConsignment(
    consignmentData: CreateConsignmentDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (![UserRole.ADMIN, UserRole.OPS].includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins and ops users can create consignments');
    }

    // Verify order exists and is confirmed
    const order = await this.prisma.order.findUnique({
      where: { id: consignmentData.orderId },
      include: {
        items: {
          where: {
            warehouseId: consignmentData.warehouseId,
          },
          include: {
            product: true,
          },
        },
        buyer: {
          select: {
            id: true,
            phone: true,
            buyerProfile: {
              select: {
                gstin: true,
              },
            },
          },
        },
        deliveryAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('Order must be confirmed or processing to create consignment');
    }

    if (order.items.length === 0) {
      throw new BadRequestException('No items found for this warehouse in the order');
    }

    // Verify warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: consignmentData.warehouseId },
    });
    if (!warehouse) {
      throw new BadRequestException('Warehouse not found');
    }

    // Verify driver if provided
    if (consignmentData.driverId) {
      const driver = await this.prisma.user.findUnique({
        where: {
          id: consignmentData.driverId,
          role: UserRole.DRIVER,
          isActive: true,
        },
        include: {
          driverProfile: true,
        },
      });
      if (!driver || !driver.driverProfile) {
        throw new BadRequestException('Driver not found or inactive');
      }
    }

    // Check if consignment already exists for this order and warehouse
    const existingConsignment = await this.prisma.consignment.findFirst({
      where: {
        orderId: consignmentData.orderId,
        warehouseId: consignmentData.warehouseId,
      },
    });
    if (existingConsignment) {
      throw new BadRequestException('Consignment already exists for this order and warehouse');
    }

    // Generate consignment number
    const consignmentNumber = await this.generateConsignmentNumber();

    // Create or find pickup address for warehouse
    let pickupAddress = await this.prisma.address.findFirst({
      where: {
        line1: warehouse.address,
        city: warehouse.city,
        state: warehouse.state,
        pincode: warehouse.pincode,
      },
    });

    if (!pickupAddress) {
      pickupAddress = await this.prisma.address.create({
        data: {
          userId: order.buyerId, // Using buyer as owner for now
          line1: warehouse.address,
          city: warehouse.city,
          state: warehouse.state,
          pincode: warehouse.pincode,
          latitude: warehouse.latitude,
          longitude: warehouse.longitude,
          isDefault: false,
        },
      });
    }

    const consignment = await this.prisma.consignment.create({
      data: {
        consignmentNumber,
        orderId: consignmentData.orderId,
        warehouseId: consignmentData.warehouseId,
        driverId: consignmentData.driverId || null,
        status: consignmentData.driverId ? ConsignmentStatus.ASSIGNED : ConsignmentStatus.PENDING,
        estimatedDeliveryDate: consignmentData.estimatedDeliveryDate,
        notes: consignmentData.notes,
        pickupAddressId: pickupAddress.id,
        deliveryAddressId: order.deliveryAddressId,
      },
      include: {
        order: {
          include: {
            buyer: {
              select: {
                id: true,
                phone: true,
                buyerProfile: {
                  select: {
                    gstin: true,
                  },
                },
              },
            },
            items: {
              where: {
                warehouseId: consignmentData.warehouseId,
              },
              include: {
                product: true,
              },
            },
          },
        },
        warehouse: true,
        driver: {
          select: {
            id: true,
            phone: true,
            driverProfile: {
              select: {
                licenseNumber: true,
                vehicleNumber: true,
              },
            },
          },
        },
      },
    });

    // Log audit trail
    await this.auditService.logCreate(
      'CONSIGNMENT',
      consignment.id,
      consignmentData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Consignment created: ${consignment.consignmentNumber}`);

    return consignment;
  }

  /**
   * Get consignment by ID
   */
  async findConsignmentById(
    consignmentId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    const consignment = await this.prisma.consignment.findUnique({
      where: { id: consignmentId },
      include: {
        order: {
          include: {
            buyer: {
              select: {
                id: true,
                phone: true,
                buyerProfile: {
                  select: {
                    gstin: true,
                  },
                },
              },
            },
            items: {
              include: {
                product: {
                  include: {
                    category: true,
                    brand: true,
                  },
                },
              },
            },
          },
        },
        warehouse: true,
        driver: {
          select: {
            id: true,
            phone: true,
            driverProfile: {
              select: {
                licenseNumber: true,
                vehicleNumber: true,
                currentLatitude: true,
                currentLongitude: true,
                locationUpdatedAt: true,
              },
            },
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }

    // Check permissions
    if (requestingUserRole === UserRole.BUYER) {
      if (consignment.order.buyerId !== requestingUserId) {
        throw new ForbiddenException('You can only view your own consignments');
      }
    } else if (requestingUserRole === UserRole.DRIVER) {
      if (consignment.driverId !== requestingUserId) {
        throw new ForbiddenException('You can only view your assigned consignments');
      }
    } else if (requestingUserRole === UserRole.OPS) {
      // OPS users can see consignments from their assigned warehouses
      const opsUser = await this.prisma.user.findUnique({
        where: { id: requestingUserId },
        include: {
          warehouseOpsUser: {
            select: {
              warehouseId: true,
            },
          },
        },
      });
      const assignedWarehouseIds = opsUser?.warehouseOpsUser?.map(w => w.warehouseId) || [];
      if (!assignedWarehouseIds.includes(consignment.warehouseId)) {
        throw new ForbiddenException('You can only view consignments from your assigned warehouses');
      }
    }
    // Admin can see all consignments

    return consignment;
  }

  /**
   * Get consignments with filters
   */
  async findConsignments(
    filters: ConsignmentFilters = {},
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    const {
      status,
      driverId,
      warehouseId,
      orderId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const { page: validPage, limit: validLimit } = this.validationService.validatePagination(page, limit);

    const where: any = {};

    // Role-based filtering
    if (requestingUserRole === UserRole.BUYER) {
      where.order = {
        buyerId: requestingUserId,
      };
    } else if (requestingUserRole === UserRole.DRIVER) {
      where.driverId = requestingUserId;
    } else if (requestingUserRole === UserRole.OPS) {
      // OPS users can see consignments from their assigned warehouses
      const opsUser = await this.prisma.user.findUnique({
        where: { id: requestingUserId },
        include: {
          warehouseOpsUser: {
            select: {
              warehouseId: true,
            },
          },
        },
      });
      const assignedWarehouseIds = opsUser?.warehouseOpsUser?.map(w => w.warehouseId) || [];
      where.warehouseId = {
        in: assignedWarehouseIds,
      };
    }
    // Admin can see all consignments

    if (status) where.status = status;
    if (driverId && [UserRole.ADMIN, UserRole.OPS].includes(requestingUserRole)) {
      where.driverId = driverId;
    }
    if (warehouseId && [UserRole.ADMIN, UserRole.OPS].includes(requestingUserRole)) {
      where.warehouseId = warehouseId;
    }
    if (orderId) where.orderId = orderId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    if (search) {
      where.OR = [
        { consignmentNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        {
          order: {
            orderNumber: { contains: search, mode: 'insensitive' },
          },
        },
        {
          order: {
            buyer: {
              phone: { contains: search },
            },
          },
        },
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [consignments, total] = await Promise.all([
      this.prisma.consignment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              buyer: {
                select: {
                  id: true,
                  phone: true,
                  buyerProfile: {
                    select: {
                      gstin: true,
                    },
                  },
                },
              },
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
          driver: {
            select: {
              id: true,
              phone: true,
              driverProfile: {
                select: {
                  licenseNumber: true,
                  vehicleNumber: true,
                },
              },
            },
          },
          _count: {
            select: {
              events: true,
            },
          },
        },
        orderBy,
        skip: (validPage - 1) * validLimit,
        take: validLimit,
      }),
      this.prisma.consignment.count({ where }),
    ]);

    return {
      items: consignments,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  /**
   * Update consignment
   */
  async updateConsignment(
    consignmentId: string,
    updateData: UpdateConsignmentDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (![UserRole.ADMIN, UserRole.OPS, UserRole.DRIVER].includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins, ops users, and drivers can update consignments');
    }

    const consignment = await this.findConsignmentById(consignmentId, requestingUserId, requestingUserRole);
    const oldValues = {
      driverId: consignment.driverId,
      status: consignment.status,
      estimatedDeliveryDate: consignment.estimatedDeliveryDate,
      actualDeliveryDate: consignment.deliveredAt,
    };

    // Validate driver assignment
    if (updateData.driverId) {
      const driver = await this.prisma.user.findUnique({
        where: {
          id: updateData.driverId,
          role: UserRole.DRIVER,
          isActive: true,
        },
        include: {
          driverProfile: true,
        },
      });
      if (!driver || !driver.driverProfile) {
        throw new BadRequestException('Driver not found or inactive');
      }
    }

    // Validate status transition
    if (updateData.status && !this.isValidStatusTransition(consignment.status as any, updateData.status)) {
      throw new BadRequestException(`Invalid status transition from ${consignment.status} to ${updateData.status}`);
    }

    // Drivers can only update status and delivery date
    if (requestingUserRole === UserRole.DRIVER) {
      if (consignment.driverId !== requestingUserId) {
        throw new ForbiddenException('You can only update your assigned consignments');
      }
      // Restrict what drivers can update
      const allowedUpdates = ['status', 'actualDeliveryDate', 'notes'];
      const updateKeys = Object.keys(updateData);
      const invalidKeys = updateKeys.filter(key => !allowedUpdates.includes(key));
      if (invalidKeys.length > 0) {
        throw new ForbiddenException(`Drivers cannot update: ${invalidKeys.join(', ')}`);
      }
    }

    await this.prisma.consignment.update({
      where: { id: consignmentId },
      data: {
        ...updateData,
        notes: updateData.notes ? `${consignment.notes || ''}
${updateData.notes}` : consignment.notes,
      } as any,
    });

    // Create tracking update if status changed
    if (updateData.status && updateData.status !== consignment.status) {
      await this.createTrackingUpdate(
        consignmentId,
        updateData.status,
        updateData.notes,
        requestingUserId,
      );
    }

    // Update order status if consignment is delivered
    if (updateData.status === ConsignmentStatus.DELIVERED) {
      await this.checkAndUpdateOrderStatus(consignment.orderId);
    }

    // Log audit trail
    await this.auditService.logUpdate(
      'CONSIGNMENT',
      consignmentId,
      oldValues,
      updateData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Consignment ${consignment.consignmentNumber} updated`);

    return this.findConsignmentById(consignmentId, requestingUserId, requestingUserRole);
  }

  /**
   * Assign driver to consignment
   */
  async assignDriver(
    consignmentId: string,
    driverId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (![UserRole.ADMIN, UserRole.OPS].includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins and ops users can assign drivers');
    }

    return this.updateConsignment(
      consignmentId,
      {
        driverId,
        status: ConsignmentStatus.ASSIGNED,
      },
      requestingUserId,
      requestingUserRole,
    );
  }

  /**
   * Update driver location
   */
  async updateDriverLocation(
    driverId: string,
    locationData: UpdateLocationDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (requestingUserRole === UserRole.DRIVER && driverId !== requestingUserId) {
      throw new ForbiddenException('You can only update your own location');
    }
    if (![UserRole.ADMIN, UserRole.OPS, UserRole.DRIVER].includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins, ops users, and drivers can update location');
    }

    // Validate coordinates
    if (!this.validationService.validateCoordinates(locationData.latitude, locationData.longitude)) {
      throw new BadRequestException('Invalid coordinates');
    }

    // Verify driver exists
    const driver = await this.prisma.user.findUnique({
      where: {
        id: driverId,
        role: UserRole.DRIVER,
        isActive: true,
      },
      include: {
        driverProfile: true,
      },
    });
    if (!driver || !driver.driverProfile) {
      throw new NotFoundException('Driver not found');
    }

    // Update driver location
    await this.prisma.driverProfile.update({
      where: { userId: driverId },
      data: {
        currentLatitude: locationData.latitude,
        currentLongitude: locationData.longitude,
        locationUpdatedAt: new Date(),
      },
    });

    // Create location tracking for active consignments
    const activeConsignments = await this.prisma.consignment.findMany({
      where: {
        driverId,
        status: {
          in: [ConsignmentStatus.PICKED_UP, ConsignmentStatus.IN_TRANSIT],
        },
      },
    });

    for (const consignment of activeConsignments) {
      await this.createTrackingUpdate(
        consignment.id,
        consignment.status as ConsignmentStatus,
        `Location updated: ${locationData.address || 'GPS coordinates'}`,
        driverId,
        locationData.latitude,
        locationData.longitude,
      );
    }

    this.logger.log(`Driver ${driverId} location updated`);

    return {
      message: 'Location updated successfully',
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      timestamp: new Date(),
    };
  }

  /**
   * Get driver's active consignments
   */
  async getDriverConsignments(
    driverId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (requestingUserRole === UserRole.DRIVER && driverId !== requestingUserId) {
      throw new ForbiddenException('You can only view your own consignments');
    }
    if (![UserRole.ADMIN, UserRole.OPS, UserRole.DRIVER].includes(requestingUserRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const consignments = await this.prisma.consignment.findMany({
      where: {
        driverId,
        status: {
          not: ConsignmentStatus.DELIVERED,
        },
      },
      include: {
        order: {
          include: {
            buyer: {
              select: {
                phone: true,
                buyerProfile: {
                  select: {
                    gstin: true,
                  },
                },
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
        },
        warehouse: {
          select: {
            name: true,
            address: true,
            city: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: {
        estimatedDeliveryDate: 'asc',
      },
    });

    return consignments;
  }

  // Helper methods

  private async generateConsignmentNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    
    const prefix = `CON${year}${month}${day}`;
    
    // Get the count of consignments created today
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const count = await this.prisma.consignment.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}${sequence}`;
  }

  private isValidStatusTransition(currentStatus: ConsignmentStatus, newStatus: ConsignmentStatus): boolean {
    const validTransitions: Record<ConsignmentStatus, ConsignmentStatus[]> = {
      [ConsignmentStatus.PENDING]: [ConsignmentStatus.ASSIGNED, ConsignmentStatus.CANCELLED],
      [ConsignmentStatus.ASSIGNED]: [ConsignmentStatus.PICKED, ConsignmentStatus.PICKED_UP, ConsignmentStatus.CANCELLED],
      [ConsignmentStatus.PICKED]: [ConsignmentStatus.PICKED_UP, ConsignmentStatus.CANCELLED],
      [ConsignmentStatus.PICKED_UP]: [ConsignmentStatus.IN_TRANSIT, ConsignmentStatus.CANCELLED],
      [ConsignmentStatus.IN_TRANSIT]: [ConsignmentStatus.DELIVERED, ConsignmentStatus.FAILED, ConsignmentStatus.CANCELLED],
      [ConsignmentStatus.DELIVERED]: [],
      [ConsignmentStatus.FAILED]: [ConsignmentStatus.PENDING],
      [ConsignmentStatus.CANCELLED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private async createTrackingUpdate(
    consignmentId: string,
    status: ConsignmentStatus,
    notes?: string,
    updatedBy?: string,
    latitude?: number,
    longitude?: number,
  ) {
    await this.prisma.consignmentEvent.create({
      data: {
        consignmentId,
        status: status as any,
        notes,
        latitude,
        longitude,
      },
    });
  }

  private async checkAndUpdateOrderStatus(orderId: string) {
    // Check if all consignments for this order are delivered
    const consignments = await this.prisma.consignment.findMany({
      where: { orderId },
    });

    const allDelivered = consignments.every(
      consignment => consignment.status === ConsignmentStatus.DELIVERED
    );

    if (allDelivered && consignments.length > 0) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
        },
      });
    }
  }
}