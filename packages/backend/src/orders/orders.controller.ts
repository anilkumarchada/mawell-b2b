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
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole, OrderStatus, PaymentStatus, PaymentMethod } from '@mawell/shared';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTOs
export class AddToCartRequestDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(10000)
  quantity: number;

  @IsUUID()
  warehouseId: string;
}

export class UpdateCartItemRequestDto {
  @IsInt()
  @Min(1)
  @Max(10000)
  quantity: number;
}

export class CreateOrderRequestDto {
  @IsUUID()
  deliveryAddressId: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  requestedDeliveryDate?: string;
}

export class UpdateOrderStatusRequestDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePaymentStatusRequestDto {
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  paymentNotes?: string;
}

export class OrderFiltersDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

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
  @IsEnum(['createdAt', 'updatedAt', 'totalAmount', 'orderNumber'])
  sortBy?: 'createdAt' | 'updatedAt' | 'totalAmount' | 'orderNumber' = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  // Cart Management Endpoints

  /**
   * Add item to cart
   */
  @Post('cart/items')
  @Roles(UserRole.BUYER)
  async addToCart(
    @Body() addToCartDto: AddToCartRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Adding item to cart for user ${user.id}`);
    return this.ordersService.addToCart(
      user.id,
      addToCartDto,
      user.id,
      user.role,
    );
  }

  /**
   * Get current user's cart
   */
  @Get('cart')
  @Roles(UserRole.BUYER)
  async getCart(@User() user: any) {
    this.logger.log(`Getting cart for user ${user.id}`);
    return this.ordersService.getCart(user.id, user.id, user.role);
  }

  /**
   * Update cart item quantity
   */
  @Put('cart/items/:cartItemId')
  @Roles(UserRole.BUYER)
  async updateCartItem(
    @Param('cartItemId') cartItemId: string,
    @Body() updateCartItemDto: UpdateCartItemRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Updating cart item ${cartItemId} for user ${user.id}`);
    return this.ordersService.updateCartItem(
      user.id,
      cartItemId,
      updateCartItemDto,
      user.id,
      user.role,
    );
  }

  /**
   * Remove item from cart
   */
  @Delete('cart/items/:cartItemId')
  @Roles(UserRole.BUYER)
  async removeFromCart(
    @Param('cartItemId') cartItemId: string,
    @User() user: any,
  ) {
    this.logger.log(`Removing cart item ${cartItemId} for user ${user.id}`);
    return this.ordersService.removeFromCart(
      user.id,
      cartItemId,
      user.id,
      user.role,
    );
  }

  /**
   * Clear cart
   */
  @Delete('cart')
  @Roles(UserRole.BUYER)
  async clearCart(@User() user: any) {
    this.logger.log(`Clearing cart for user ${user.id}`);
    return this.ordersService.clearCart(user.id, user.id, user.role);
  }

  // Admin Cart Management

  /**
   * Add item to user's cart (Admin only)
   */
  @Post('users/:userId/cart/items')
  @Roles(UserRole.ADMIN)
  async addToCartForUser(
    @Param('userId') userId: string,
    @Body() addToCartDto: AddToCartRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Admin ${user.id} adding item to cart for user ${userId}`);
    return this.ordersService.addToCart(
      userId,
      addToCartDto,
      user.id,
      user.role,
    );
  }

  /**
   * Get user's cart (Admin only)
   */
  @Get('users/:userId/cart')
  @Roles(UserRole.ADMIN)
  async getCartForUser(
    @Param('userId') userId: string,
    @User() user: any,
  ) {
    this.logger.log(`Admin ${user.id} getting cart for user ${userId}`);
    return this.ordersService.getCart(userId, user.id, user.role);
  }

  /**
   * Update cart item for user (Admin only)
   */
  @Put('users/:userId/cart/items/:cartItemId')
  @Roles(UserRole.ADMIN)
  async updateCartItemForUser(
    @Param('userId') userId: string,
    @Param('cartItemId') cartItemId: string,
    @Body() updateCartItemDto: UpdateCartItemRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Admin ${user.id} updating cart item ${cartItemId} for user ${userId}`);
    return this.ordersService.updateCartItem(
      userId,
      cartItemId,
      updateCartItemDto,
      user.id,
      user.role,
    );
  }

  /**
   * Remove item from user's cart (Admin only)
   */
  @Delete('users/:userId/cart/items/:cartItemId')
  @Roles(UserRole.ADMIN)
  async removeFromCartForUser(
    @Param('userId') userId: string,
    @Param('cartItemId') cartItemId: string,
    @User() user: any,
  ) {
    this.logger.log(`Admin ${user.id} removing cart item ${cartItemId} for user ${userId}`);
    return this.ordersService.removeFromCart(
      userId,
      cartItemId,
      user.id,
      user.role,
    );
  }

  /**
   * Clear user's cart (Admin only)
   */
  @Delete('users/:userId/cart')
  @Roles(UserRole.ADMIN)
  async clearCartForUser(
    @Param('userId') userId: string,
    @User() user: any,
  ) {
    this.logger.log(`Admin ${user.id} clearing cart for user ${userId}`);
    return this.ordersService.clearCart(userId, user.id, user.role);
  }

  // Order Management Endpoints

  /**
   * Create order from cart
   */
  @Post()
  @Roles(UserRole.BUYER)
  async createOrder(
    @Body() createOrderDto: CreateOrderRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Creating order for user ${user.id}`);
    const orderData = {
      ...createOrderDto,
      requestedDeliveryDate: createOrderDto.requestedDeliveryDate
        ? new Date(createOrderDto.requestedDeliveryDate)
        : undefined,
    };
    return this.ordersService.createOrder(
      user.id,
      orderData,
      user.id,
      user.role,
    );
  }

  /**
   * Get current user's orders
   */
  @Get('my-orders')
  @Roles(UserRole.BUYER)
  async getMyOrders(
    @Query() filters: OrderFiltersDto,
    @User() user: any,
  ) {
    this.logger.log(`Getting orders for user ${user.id}`);
    const filterData = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };
    return this.ordersService.findOrders(filterData, user.id, user.role);
  }

  /**
   * Get all orders (Admin/OPS)
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getOrders(
    @Query() filters: OrderFiltersDto,
    @User() user: any,
  ) {
    this.logger.log(`Getting orders for ${user.role} user ${user.id}`);
    const filterData = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };
    return this.ordersService.findOrders(filterData, user.id, user.role);
  }

  /**
   * Get order by ID
   */
  @Get(':orderId')
  @Roles(UserRole.BUYER, UserRole.ADMIN, UserRole.OPS)
  async getOrderById(
    @Param('orderId') orderId: string,
    @User() user: any,
  ) {
    this.logger.log(`Getting order ${orderId} for user ${user.id}`);
    return this.ordersService.findOrderById(orderId, user.role, user.id);
  }

  /**
   * Create order for user (Admin only)
   */
  @Post('users/:userId')
  @Roles(UserRole.ADMIN)
  async createOrderForUser(
    @Param('userId') userId: string,
    @Body() createOrderDto: CreateOrderRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Admin ${user.id} creating order for user ${userId}`);
    const orderData = {
      ...createOrderDto,
      requestedDeliveryDate: createOrderDto.requestedDeliveryDate
        ? new Date(createOrderDto.requestedDeliveryDate)
        : undefined,
    };
    return this.ordersService.createOrder(
      userId,
      orderData,
      user.id,
      user.role,
    );
  }

  /**
   * Update order status
   */
  @Put(':orderId/status')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() updateStatusDto: UpdateOrderStatusRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Updating order ${orderId} status to ${updateStatusDto.status}`);
    return this.ordersService.updateOrderStatus(
      orderId,
      updateStatusDto,
      user.id,
      user.role,
    );
  }

  /**
   * Update payment status
   */
  @Put(':orderId/payment')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async updatePaymentStatus(
    @Param('orderId') orderId: string,
    @Body() updatePaymentDto: UpdatePaymentStatusRequestDto,
    @User() user: any,
  ) {
    this.logger.log(`Updating order ${orderId} payment status to ${updatePaymentDto.paymentStatus}`);
    return this.ordersService.updatePaymentStatus(
      orderId,
      updatePaymentDto,
      user.id,
      user.role,
    );
  }

  /**
   * Health check
   */
  @Get('health/check')
  @Public()
  async healthCheck() {
    return {
      service: 'Orders Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}