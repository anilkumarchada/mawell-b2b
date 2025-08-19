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
import { ProductsService } from '../products/products.service';
import { UserRole, OrderStatus, PaymentStatus, PaymentMethod } from '@mawell/shared';

export interface AddToCartDto {
  productId: string;
  quantity: number;
  warehouseId: string;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export interface CreateOrderDto {
  deliveryAddressId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  requestedDeliveryDate?: Date;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}

export interface UpdatePaymentStatusDto {
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paymentNotes?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  buyerId?: string;
  warehouseId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'totalAmount' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private validationService: ValidationService,
    private productsService: ProductsService,
  ) {}

  // Cart Management

  /**
   * Add item to cart
   */
  async addToCart(
    userId: string,
    cartData: AddToCartDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only manage your own cart');
    }

    // Verify user is a buyer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: true },
    });
    if (!user || user.role !== UserRole.BUYER || !user.buyerProfile) {
      throw new BadRequestException('Only buyers can have a cart');
    }

    // Verify product exists and is active
    const product = await this.productsService.findById(cartData.productId);
    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    // Verify warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: cartData.warehouseId },
    });
    if (!warehouse) {
      throw new BadRequestException('Warehouse not found');
    }

    // Check inventory availability
    const inventory = await this.prisma.inventory.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: cartData.warehouseId,
          productId: cartData.productId,
        },
      },
    });
    if (!inventory || inventory.quantity < cartData.quantity) {
      throw new BadRequestException('Insufficient inventory');
    }

    // Validate quantity constraints
    if (product.moq && cartData.quantity < product.moq) {
      throw new BadRequestException(`Minimum order quantity is ${product.moq}`);
    }

    // Find or create cart for user
    let cart = await this.prisma.cart.findUnique({
      where: { userId: userId },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId: userId },
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: cartData.productId,
        },
      },
    });

    let cartItem;
    if (existingCartItem) {
      // Update existing cart item
      const newQuantity = existingCartItem.quantity + cartData.quantity;
      
      // Check inventory for new quantity
      if (inventory.quantity < newQuantity) {
        throw new BadRequestException('Insufficient inventory for requested quantity');
      }
      
      // No maximum order quantity validation needed

      cartItem = await this.prisma.cartItem.update({
        where: {
          id: existingCartItem.id,
        },
        data: {
          quantity: newQuantity,
          price: product.price,
        },
        include: {
          product: true,
          warehouse: true,
        },
      });
    } else {
      // Create new cart item
      cartItem = await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          buyerProfileId: user.buyerProfile.id,
          productId: cartData.productId,
          warehouseId: cartData.warehouseId,
          quantity: cartData.quantity,
          price: product.price,
        },
        include: {
          product: true,
          warehouse: true,
        },
      });
    }

    this.logger.log(`Item added to cart for user ${userId}`);

    return cartItem;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    userId: string,
    cartItemId: string,
    updateData: UpdateCartItemDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only manage your own cart');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: true },
    });
    if (!user || user.role !== UserRole.BUYER || !user.buyerProfile) {
      throw new BadRequestException('Only buyers can have a cart');
    }

    // Find cart item
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        buyerProfileId: user.buyerProfile.id,
      },
      include: {
        product: true,
        warehouse: true,
      },
    });
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Check inventory availability
    const inventory = await this.prisma.inventory.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: cartItem.warehouseId,
          productId: cartItem.productId,
        },
      },
    });
    if (!inventory || inventory.quantity < updateData.quantity) {
      throw new BadRequestException('Insufficient inventory');
    }

    // Validate quantity constraints
    if (cartItem.product.moq && updateData.quantity < cartItem.product.moq) {
      throw new BadRequestException(`Minimum order quantity is ${cartItem.product.moq}`);
    }

    const updatedCartItem = await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity: updateData.quantity,
        price: cartItem.product.price, // Update price in case it changed
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    this.logger.log(`Cart item ${cartItemId} updated for user ${userId}`);

    return updatedCartItem;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(
    userId: string,
    cartItemId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only manage your own cart');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: true },
    });
    if (!user || user.role !== UserRole.BUYER || !user.buyerProfile) {
      throw new BadRequestException('Only buyers can have a cart');
    }

    // Find cart item
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        buyerProfileId: user.buyerProfile.id,
      },
    });
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    this.logger.log(`Cart item ${cartItemId} removed for user ${userId}`);

    return { message: 'Item removed from cart successfully' };
  }

  /**
   * Get user's cart
   */
  async getCart(
    userId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only view your own cart');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: true },
    });
    if (!user || user.role !== UserRole.BUYER || !user.buyerProfile) {
      throw new BadRequestException('Only buyers can have a cart');
    }

    const cartItems = await this.prisma.cartItem.findMany({
      where: {
        buyerProfileId: user.buyerProfile.id,
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
          },
        },
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items: cartItems,
      summary: {
        totalItems,
        subtotal,
        itemCount: cartItems.length,
      },
    };
  }

  /**
   * Clear user's cart
   */
  async clearCart(
    userId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only clear your own cart');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: true },
    });
    if (!user || user.role !== UserRole.BUYER || !user.buyerProfile) {
      throw new BadRequestException('Only buyers can have a cart');
    }

    await this.prisma.cartItem.deleteMany({
      where: {
        buyerProfileId: user.buyerProfile.id,
      },
    });

    this.logger.log(`Cart cleared for user ${userId}`);

    return { message: 'Cart cleared successfully' };
  }

  // Order Management

  /**
   * Create order from cart
   */
  async createOrder(
    userId: string,
    orderData: CreateOrderDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Check permissions
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only create orders for yourself');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: true },
    });
    if (!user || user.role !== UserRole.BUYER || !user.buyerProfile) {
      throw new BadRequestException('Only buyers can create orders');
    }

    // Verify delivery address
    const address = await this.prisma.address.findFirst({
      where: {
        id: orderData.deliveryAddressId,
        userId: userId,
      },
    });
    if (!address) {
      throw new BadRequestException('Delivery address not found');
    }

    // Get cart items
    const cartItems = await this.prisma.cartItem.findMany({
      where: {
        buyerProfileId: user.buyerProfile.id,
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate inventory for all items
    for (const item of cartItems) {
      const inventory = await this.prisma.inventory.findUnique({
        where: {
          warehouseId_productId: {
            warehouseId: item.warehouseId,
            productId: item.productId,
          },
        },
      });
      if (!inventory || inventory.quantity < item.quantity) {
        throw new BadRequestException(`Insufficient inventory for product: ${item.product.name}`);
      }
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal + taxAmount;

    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerId: userId,
          deliveryAddressId: orderData.deliveryAddressId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: orderData.paymentMethod,
          subtotal,
          taxAmount,
          deliveryFee: 0, // Default delivery fee
          totalAmount,
          notes: orderData.notes,
          estimatedDeliveryAt: orderData.requestedDeliveryDate,
        },
      });

      // Create order items
      for (const cartItem of cartItems) {
        const itemTotalPrice = cartItem.quantity * cartItem.price;
        const itemTaxAmount = itemTotalPrice * 0.18; // 18% GST
        
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: cartItem.productId,
            warehouseId: cartItem.warehouseId,
            quantity: cartItem.quantity,
            price: cartItem.price,
            totalPrice: itemTotalPrice,
            taxAmount: itemTaxAmount,
          },
        });

        // Reserve inventory
        await tx.inventory.update({
          where: {
            warehouseId_productId: {
              warehouseId: cartItem.warehouseId,
              productId: cartItem.productId,
            },
          },
          data: {
            reservedQuantity: {
              increment: cartItem.quantity,
            },
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: {
          buyerProfileId: user.buyerProfile!.id,
        },
      });

      return newOrder;
    });

    // Log audit trail
    await this.auditService.logCreate(
      'ORDER',
      order.id,
      orderData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Order created: ${order.orderNumber}`);

    return this.findOrderById(order.id);
  }

  /**
   * Get order by ID
   */
  async findOrderById(orderId: string, requestingUserRole?: UserRole, requestingUserId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: {
            id: true,
            phone: true,
            buyerProfile: {
              select: {
                shopName: true,
                gstin: true,
              },
            },
          },
        },
        deliveryAddress: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
                brand: true,
              },
            },
            warehouse: true,
          },
        },
        consignments: {
          include: {
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
            warehouse: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check permissions
    if (requestingUserRole && requestingUserId) {
      if (
        requestingUserRole !== UserRole.ADMIN &&
        requestingUserRole !== UserRole.OPS &&
        order.buyerId !== requestingUserId
      ) {
        throw new ForbiddenException('You can only view your own orders');
      }
    }

    return order;
  }

  /**
   * Get orders with filters
   */
  async findOrders(
    filters: OrderFilters = {},
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    const {
      status,
      paymentStatus,
      buyerId,
      warehouseId,
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
      where.buyerId = requestingUserId;
    } else if (requestingUserRole === UserRole.OPS) {
      // OPS users can see orders from their assigned warehouses
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
      if (opsUser?.warehouseOpsUser?.length > 0) {
        where.items = {
          some: {
            warehouseId: {
              in: opsUser.warehouseOpsUser.map(w => w.warehouseId),
            },
          },
        };
      }
    }
    // Admin can see all orders

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (buyerId && requestingUserRole === UserRole.ADMIN) where.buyerId = buyerId;
    if (warehouseId) {
      where.items = {
        some: {
          warehouseId,
        },
      };
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        {
          buyer: {
            phone: { contains: search },
          },
        },
        {
          buyer: {
            buyerProfile: {
              businessName: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              phone: true,
              buyerProfile: {
                select: {
                  shopName: true,
                  gstin: true,
                },
              },
            },
          },
          deliveryAddress: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
              warehouse: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                },
              },
            },
          },
          _count: {
            select: {
              items: true,
              consignments: true,
            },
          },
        },
        orderBy,
        skip: (validPage - 1) * validLimit,
        take: validLimit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    statusData: UpdateOrderStatusDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (![UserRole.ADMIN, UserRole.OPS].includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins and ops users can update order status');
    }

    const order = await this.findOrderById(orderId);
    const oldValues = { status: order.status };

    // Validate status transition
    if (!this.isValidStatusTransition(order.status as OrderStatus, statusData.status)) {
      throw new BadRequestException(`Invalid status transition from ${order.status} to ${statusData.status}`);
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: statusData.status,
        notes: statusData.notes ? `${order.notes || ''}\n${statusData.notes}` : order.notes,
      },
    });

    // Handle inventory changes based on status
    if (statusData.status === OrderStatus.CANCELLED) {
      // Release reserved inventory
      await this.releaseOrderInventory(orderId);
    } else if (statusData.status === OrderStatus.CONFIRMED) {
      // Deduct inventory
      await this.deductOrderInventory(orderId);
    }

    // Log audit trail
    await this.auditService.logUpdate(
      'ORDER',
      orderId,
      oldValues,
      statusData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Order ${order.orderNumber} status updated to ${statusData.status}`);

    return this.findOrderById(orderId);
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentData: UpdatePaymentStatusDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (![UserRole.ADMIN, UserRole.OPS].includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins and ops users can update payment status');
    }

    const order = await this.findOrderById(orderId);
    const oldValues = {
      paymentStatus: order.paymentStatus,
      paymentReference: order.paymentReference,
    };

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: paymentData.paymentStatus,
        paymentReference: paymentData.paymentReference,
        paymentDate: paymentData.paymentStatus === PaymentStatus.PAID ? new Date() : null,
        notes: paymentData.paymentNotes ? `${order.notes || ''}\n${paymentData.paymentNotes}` : order.notes,
      },
    });

    // Log audit trail
    await this.auditService.logUpdate(
      'ORDER',
      orderId,
      oldValues,
      paymentData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Order ${order.orderNumber} payment status updated to ${paymentData.paymentStatus}`);

    return this.findOrderById(orderId);
  }

  // Helper methods

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    
    const prefix = `ORD${year}${month}${day}`;
    
    // Get the count of orders created today
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const count = await this.prisma.order.count({
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

  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.RETURNED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.RETURNED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private async releaseOrderInventory(orderId: string) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    for (const item of orderItems) {
      await this.prisma.inventory.update({
        where: {
          warehouseId_productId: {
            warehouseId: item.warehouseId,
            productId: item.productId,
          },
        },
        data: {
          reservedQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }
  }

  private async deductOrderInventory(orderId: string) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    for (const item of orderItems) {
      await this.prisma.inventory.update({
        where: {
          warehouseId_productId: {
            warehouseId: item.warehouseId,
            productId: item.productId,
          },
        },
        data: {
          quantity: {
            decrement: item.quantity,
          },
          reservedQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }
  }
}