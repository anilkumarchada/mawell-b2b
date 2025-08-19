import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { ValidationService } from '../common/services/validation.service';
import { UserRole, OrderStatus, ConsignmentStatus, PaymentStatus } from '@mawell/shared';

export interface DateRangeDto {
  startDate: Date;
  endDate: Date;
  warehouseId?: string;
  userId?: string;
}

export interface SalesReportDto {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  topBuyers: Array<{
    buyerId: string;
    buyerName: string;
    totalOrders: number;
    totalRevenue: number;
  }>;
  dailySales: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

export interface OrderAnalyticsDto {
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByPaymentStatus: Record<PaymentStatus, number>;
  averageDeliveryTime: number; // in hours
  orderTrends: Array<{
    date: string;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }>;
}

export interface InventoryReportDto {
  totalProducts: number;
  totalInventoryValue: number;
  lowStockProducts: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
    warehouseName: string;
  }>;
  warehouseInventory: Array<{
    warehouseId: string;
    warehouseName: string;
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
  }>;
}

export interface DeliveryPerformanceDto {
  totalConsignments: number;
  consignmentsByStatus: Record<ConsignmentStatus, number>;
  averageDeliveryTime: number; // in hours
  onTimeDeliveryRate: number; // percentage
  topPerformingDrivers: Array<{
    driverId: string;
    driverName: string;
    totalDeliveries: number;
    onTimeDeliveries: number;
    averageDeliveryTime: number;
  }>;
  deliveryTrends: Array<{
    date: string;
    totalConsignments: number;
    delivered: number;
    onTime: number;
  }>;
}

export interface DashboardStatsDto {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalProducts: number;
  lowStockAlerts: number;
  activeConsignments: number;
  pendingConsignments: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly validationService: ValidationService,
  ) {}

  /**
   * Generate sales report
   */
  async generateSalesReport(
    dateRange: DateRangeDto,
    userId: string,
    userRole: UserRole,
  ): Promise<SalesReportDto> {
    this.logger.log(`Generating sales report for ${userRole} user ${userId}`);

    // Role-based access control
    if (![UserRole.ADMIN, UserRole.OPS].includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions to access sales reports');
    }

    const { startDate, endDate, warehouseId } = dateRange;

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        not: OrderStatus.CANCELLED,
      },
    };

    // If OPS user, filter by their warehouse
    if (userRole === UserRole.OPS) {
      const userWarehouses = await this.prisma.warehouseOpsUser.findMany({
        where: { opsUserId: userId },
        select: { warehouseId: true },
      });
      
      if (userWarehouses.length === 0) {
        throw new ForbiddenException('No warehouse access found');
      }

      whereClause.consignments = {
        some: {
          warehouseId: {
            in: userWarehouses.map(w => w.warehouseId),
          },
        },
      };
    } else if (warehouseId) {
      whereClause.consignments = {
        some: {
          warehouseId,
        },
      };
    }

    // Get orders with items
    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        buyer: true,
      },
    });

    // Calculate totals
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products
    const productStats = new Map<string, {
      productId: string;
      productName: string;
      totalQuantity: number;
      totalRevenue: number;
    }>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.productId;
        const existing = productStats.get(key) || {
          productId: item.productId,
          productName: item.product.name,
          totalQuantity: 0,
          totalRevenue: 0,
        };
        
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.price * item.quantity;
        productStats.set(key, existing);
      });
    });

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Top buyers
    const buyerStats = new Map<string, {
      buyerId: string;
      buyerName: string;
      totalOrders: number;
      totalRevenue: number;
    }>();

    orders.forEach(order => {
      const key = order.buyerId;
      const existing = buyerStats.get(key) || {
        buyerId: order.buyerId,
        buyerName: order.buyer.name,
        totalOrders: 0,
        totalRevenue: 0,
      };
      
      existing.totalOrders += 1;
      existing.totalRevenue += order.totalAmount;
      buyerStats.set(key, existing);
    });

    const topBuyers = Array.from(buyerStats.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Daily sales
    const dailyStats = new Map<string, { orders: number; revenue: number }>();
    
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      const existing = dailyStats.get(date) || { orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += order.totalAmount;
      dailyStats.set(date, existing);
    });

    const dailySales = Array.from(dailyStats.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Log audit
    await this.auditService.log({
      action: 'GENERATE_SALES_REPORT',
      resource: 'SALES_REPORT',
      userId,
      userRole,
      metadata: {
        dateRange,
        totalOrders,
        totalRevenue,
      },
    });

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      topProducts,
      topBuyers,
      dailySales,
    };
  }

  /**
   * Generate order analytics
   */
  async generateOrderAnalytics(
    dateRange: DateRangeDto,
    userId: string,
    userRole: UserRole,
  ): Promise<OrderAnalyticsDto> {
    this.logger.log(`Generating order analytics for ${userRole} user ${userId}`);

    // Role-based access control
    if (![UserRole.ADMIN, UserRole.OPS].includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions to access order analytics');
    }

    const { startDate, endDate, warehouseId } = dateRange;

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Apply warehouse filter for OPS users
    if (userRole === UserRole.OPS) {
      const userWarehouses = await this.prisma.warehouseOpsUser.findMany({
        where: { opsUserId: userId },
        select: { warehouseId: true },
      });
      
      if (userWarehouses.length === 0) {
        throw new ForbiddenException('No warehouse access found');
      }

      whereClause.consignments = {
        some: {
          warehouseId: {
            in: userWarehouses.map(w => w.warehouseId),
          },
        },
      };
    } else if (warehouseId) {
      whereClause.consignments = {
        some: {
          warehouseId,
        },
      };
    }

    // Get orders with consignments
    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        consignments: true,
      },
    });

    const totalOrders = orders.length;

    // Orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    // Orders by payment status
    const ordersByPaymentStatus = orders.reduce((acc, order) => {
      acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1;
      return acc;
    }, {} as Record<PaymentStatus, number>);

    // Calculate average delivery time
    const deliveredOrders = orders.filter(order => order.status === OrderStatus.DELIVERED);
    let totalDeliveryTime = 0;
    let deliveredCount = 0;

    deliveredOrders.forEach(order => {
      const deliveredConsignments = order.consignments.filter(
        c => c.status === ConsignmentStatus.DELIVERED && c.deliveredAt
      );
      
      if (deliveredConsignments.length > 0) {
        const latestDelivery = Math.max(
          ...deliveredConsignments.map(c => c.deliveredAt!.getTime())
        );
        const deliveryTime = (latestDelivery - order.createdAt.getTime()) / (1000 * 60 * 60); // hours
        totalDeliveryTime += deliveryTime;
        deliveredCount++;
      }
    });

    const averageDeliveryTime = deliveredCount > 0 ? totalDeliveryTime / deliveredCount : 0;

    // Order trends by day
    const dailyTrends = new Map<string, {
      pending: number;
      confirmed: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    }>();

    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      const existing = dailyTrends.get(date) || {
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };
      
      existing[order.status.toLowerCase() as keyof typeof existing]++;
      dailyTrends.set(date, existing);
    });

    const orderTrends = Array.from(dailyTrends.entries())
      .map(([date, trends]) => ({ date, ...trends }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalOrders,
      ordersByStatus,
      ordersByPaymentStatus,
      averageDeliveryTime,
      orderTrends,
    };
  }

  /**
   * Generate inventory report
   */
  async generateInventoryReport(
    warehouseId: string | undefined,
    userId: string,
    userRole: UserRole,
  ): Promise<InventoryReportDto> {
    this.logger.log(`Generating inventory report for ${userRole} user ${userId}`);

    // Role-based access control
    if (![UserRole.ADMIN, UserRole.OPS].includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions to access inventory reports');
    }

    // Build where clause for warehouses
    const warehouseFilter: any = {};
    
    if (userRole === UserRole.OPS) {
      const userWarehouses = await this.prisma.warehouseOpsUser.findMany({
        where: { opsUserId: userId },
        select: { warehouseId: true },
      });
      
      if (userWarehouses.length === 0) {
        throw new ForbiddenException('No warehouse access found');
      }

      warehouseFilter.id = {
        in: userWarehouses.map(w => w.warehouseId),
      };
    } else if (warehouseId) {
      warehouseFilter.id = warehouseId;
    }

    // Get inventory data
    const inventoryData = await this.prisma.inventory.findMany({
      where: {
        warehouse: warehouseFilter,
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    const totalProducts = inventoryData.length;
    const totalInventoryValue = inventoryData.reduce(
      (sum, inv) => sum + (inv.quantity * inv.product.price),
      0
    );

    // Low stock products (available stock < 10)
    const lowStockProducts = inventoryData
      .filter(inv => (inv.quantity - inv.reservedQuantity) < 10)
      .map(inv => ({
        productId: inv.productId,
        productName: inv.product.name,
        currentStock: inv.quantity,
        reservedStock: inv.reservedQuantity,
        availableStock: inv.quantity - inv.reservedQuantity,
        warehouseName: inv.warehouse.name,
      }));

    // Warehouse inventory summary
    const warehouseStats = new Map<string, {
      warehouseId: string;
      warehouseName: string;
      totalProducts: number;
      totalQuantity: number;
      totalValue: number;
    }>();

    inventoryData.forEach(inv => {
      const key = inv.warehouseId;
      const existing = warehouseStats.get(key) || {
        warehouseId: inv.warehouseId,
        warehouseName: inv.warehouse.name,
        totalProducts: 0,
        totalQuantity: 0,
        totalValue: 0,
      };
      
      existing.totalProducts += 1;
      existing.totalQuantity += inv.quantity;
      existing.totalValue += inv.quantity * inv.product.price;
      warehouseStats.set(key, existing);
    });

    const warehouseInventory = Array.from(warehouseStats.values());

    return {
      totalProducts,
      totalInventoryValue,
      lowStockProducts,
      warehouseInventory,
    };
  }

  /**
   * Generate delivery performance report
   */
  async generateDeliveryPerformance(
    dateRange: DateRangeDto,
    userId: string,
    userRole: UserRole,
  ): Promise<DeliveryPerformanceDto> {
    this.logger.log(`Generating delivery performance report for ${userRole} user ${userId}`);

    // Role-based access control
    if (![UserRole.ADMIN, UserRole.OPS].includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions to access delivery reports');
    }

    const { startDate, endDate, warehouseId } = dateRange;

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Apply warehouse filter for OPS users
    if (userRole === UserRole.OPS) {
      const userWarehouses = await this.prisma.warehouseOpsUser.findMany({
        where: { opsUserId: userId },
        select: { warehouseId: true },
      });
      
      if (userWarehouses.length === 0) {
        throw new ForbiddenException('No warehouse access found');
      }

      whereClause.warehouseId = {
        in: userWarehouses.map(w => w.warehouseId),
      };
    } else if (warehouseId) {
      whereClause.warehouseId = warehouseId;
    }

    // Get consignments with driver info
    const consignments = await this.prisma.consignment.findMany({
      where: whereClause,
      include: {
        driver: true,
        order: true,
      },
    });

    const totalConsignments = consignments.length;

    // Consignments by status
    const consignmentsByStatus = consignments.reduce((acc, consignment) => {
      acc[consignment.status] = (acc[consignment.status] || 0) + 1;
      return acc;
    }, {} as Record<ConsignmentStatus, number>);

    // Calculate delivery metrics
    const deliveredConsignments = consignments.filter(
      c => c.status === ConsignmentStatus.DELIVERED && c.deliveredAt
    );

    let totalDeliveryTime = 0;
    let onTimeDeliveries = 0;

    deliveredConsignments.forEach(consignment => {
      const deliveryTime = (consignment.deliveredAt!.getTime() - consignment.createdAt.getTime()) / (1000 * 60 * 60);
      totalDeliveryTime += deliveryTime;
      
      // Consider on-time if delivered within 48 hours
      if (deliveryTime <= 48) {
        onTimeDeliveries++;
      }
    });

    const averageDeliveryTime = deliveredConsignments.length > 0 ? totalDeliveryTime / deliveredConsignments.length : 0;
    const onTimeDeliveryRate = deliveredConsignments.length > 0 ? (onTimeDeliveries / deliveredConsignments.length) * 100 : 0;

    // Top performing drivers
    const driverStats = new Map<string, {
      driverId: string;
      driverName: string;
      totalDeliveries: number;
      onTimeDeliveries: number;
      totalDeliveryTime: number;
    }>();

    deliveredConsignments.forEach(consignment => {
      if (consignment.driverId) {
        const key = consignment.driverId;
        const existing = driverStats.get(key) || {
          driverId: consignment.driverId,
          driverName: consignment.driver?.name || 'Unknown',
          totalDeliveries: 0,
          onTimeDeliveries: 0,
          totalDeliveryTime: 0,
        };
        
        const deliveryTime = (consignment.deliveredAt!.getTime() - consignment.createdAt.getTime()) / (1000 * 60 * 60);
        existing.totalDeliveries += 1;
        existing.totalDeliveryTime += deliveryTime;
        
        if (deliveryTime <= 48) {
          existing.onTimeDeliveries += 1;
        }
        
        driverStats.set(key, existing);
      }
    });

    const topPerformingDrivers = Array.from(driverStats.values())
      .map(driver => ({
        ...driver,
        averageDeliveryTime: driver.totalDeliveries > 0 ? driver.totalDeliveryTime / driver.totalDeliveries : 0,
      }))
      .sort((a, b) => (b.onTimeDeliveries / b.totalDeliveries) - (a.onTimeDeliveries / a.totalDeliveries))
      .slice(0, 10);

    // Daily delivery trends
    const dailyTrends = new Map<string, {
      totalConsignments: number;
      delivered: number;
      onTime: number;
    }>();

    consignments.forEach(consignment => {
      const date = consignment.createdAt.toISOString().split('T')[0];
      const existing = dailyTrends.get(date) || {
        totalConsignments: 0,
        delivered: 0,
        onTime: 0,
      };
      
      existing.totalConsignments += 1;
      
      if (consignment.status === ConsignmentStatus.DELIVERED) {
        existing.delivered += 1;
        
        if (consignment.deliveredAt) {
          const deliveryTime = (consignment.deliveredAt.getTime() - consignment.createdAt.getTime()) / (1000 * 60 * 60);
          if (deliveryTime <= 48) {
            existing.onTime += 1;
          }
        }
      }
      
      dailyTrends.set(date, existing);
    });

    const deliveryTrends = Array.from(dailyTrends.entries())
      .map(([date, trends]) => ({ date, ...trends }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalConsignments,
      consignmentsByStatus,
      averageDeliveryTime,
      onTimeDeliveryRate,
      topPerformingDrivers,
      deliveryTrends,
    };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(
    userId: string,
    userRole: UserRole,
  ): Promise<DashboardStatsDto> {
    this.logger.log(`Getting dashboard stats for ${userRole} user ${userId}`);

    // Role-based access control
    if (![UserRole.ADMIN, UserRole.OPS].includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions to access dashboard stats');
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build warehouse filter for OPS users
    let warehouseFilter: any = {};
    if (userRole === UserRole.OPS) {
      const userWarehouses = await this.prisma.warehouseOpsUser.findMany({
        where: { opsUserId: userId },
        select: { warehouseId: true },
      });
      
      if (userWarehouses.length === 0) {
        throw new ForbiddenException('No warehouse access found');
      }

      warehouseFilter = {
        in: userWarehouses.map(w => w.warehouseId),
      };
    }

    // Get basic counts
    const [totalUsers, activeUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    // Order stats
    const orderWhereClause = userRole === UserRole.OPS ? {
      consignments: {
        some: {
          warehouseId: warehouseFilter,
        },
      },
    } : {};

    const [totalOrders, pendingOrders, totalRevenue, monthlyRevenue] = await Promise.all([
      this.prisma.order.count({ where: orderWhereClause }),
      this.prisma.order.count({
        where: {
          ...orderWhereClause,
          status: OrderStatus.PENDING,
        },
      }),
      this.prisma.order.aggregate({
        where: {
          ...orderWhereClause,
          status: { not: OrderStatus.CANCELLED },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          ...orderWhereClause,
          status: { not: OrderStatus.CANCELLED },
          createdAt: { gte: monthStart },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    // Product and inventory stats
    const inventoryWhereClause = userRole === UserRole.OPS ? {
      warehouseId: warehouseFilter,
    } : {};

    const [totalProducts, lowStockCount] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.inventory.count({
        where: {
          ...inventoryWhereClause,
          quantity: { lte: this.prisma.inventory.fields.reservedQuantity },
        },
      }),
    ]);

    // Consignment stats
    const consignmentWhereClause = userRole === UserRole.OPS ? {
      warehouseId: warehouseFilter,
    } : {};

    const [activeConsignments, pendingConsignments] = await Promise.all([
      this.prisma.consignment.count({
        where: {
          ...consignmentWhereClause,
          status: {
            in: [ConsignmentStatus.ASSIGNED, ConsignmentStatus.PICKED_UP, ConsignmentStatus.IN_TRANSIT],
          },
        },
      }),
      this.prisma.consignment.count({
        where: {
          ...consignmentWhereClause,
          status: ConsignmentStatus.PENDING,
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      totalProducts,
      lowStockAlerts: lowStockCount,
      activeConsignments,
      pendingConsignments,
    };
  }
}