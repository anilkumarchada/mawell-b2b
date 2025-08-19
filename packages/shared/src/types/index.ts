// User and Authentication Types
export enum UserRole {
  BUYER = 'BUYER',
  DRIVER = 'DRIVER',
  OPS = 'OPS',
  ADMIN = 'ADMIN'
}

export enum KYCStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
  COD = 'COD'
}

export enum ConsignmentStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED = 'PICKED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum Language {
  ENGLISH = 'EN',
  TELUGU = 'TE'
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED'
}

// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  phone: string;
  role: UserRole;
  isActive: boolean;
  language: Language;
  lastLoginAt?: Date;
}

export interface BuyerProfile extends BaseEntity {
  userId: string;
  shopName: string;
  gstin?: string;
  kycStatus: KYCStatus;
  kycDocumentUrl?: string;
  kycRejectionReason?: string;
}

export interface DriverProfile extends BaseEntity {
  userId: string;
  vehicleNumber: string;
  licenseNumber: string;
  licenseDocumentUrl: string;
  isAvailable: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}

export interface Address extends BaseEntity {
  userId: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface Product extends BaseEntity {
  name: string;
  description: string;
  categoryId: string;
  brandId?: string;
  hsnCode: string;
  taxRate: number;
  images: string[];
  isActive: boolean;
  moq: number;
  returnPolicy?: string;
}

export interface ProductVariant extends BaseEntity {
  productId: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  isActive: boolean;
}

export interface PricingTier extends BaseEntity {
  variantId: string;
  minQuantity: number;
  maxQuantity?: number;
  price: number;
  mrp: number;
}

export interface Order extends BaseEntity {
  orderNumber: string;
  buyerId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  deliveryAddress: Address;
  estimatedDeliveryAt?: Date;
  deliveredAt?: Date;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

export interface OrderItem extends BaseEntity {
  orderId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
}

export interface Consignment extends BaseEntity {
  orderIds: string[];
  driverId?: string;
  status: ConsignmentStatus;
  pickupAddress: Address;
  deliveryAddresses: Address[];
  assignedAt?: Date;
  pickedAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  podImageUrl?: string;
  signatureUrl?: string;
  codAmount?: number;
  codCollected?: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// WebSocket event types
export interface SocketEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface OrderUpdateEvent extends SocketEvent {
  type: 'ORDER_UPDATE';
  payload: {
    orderId: string;
    status: OrderStatus;
    message?: string;
  };
}

export interface LocationUpdateEvent extends SocketEvent {
  type: 'LOCATION_UPDATE';
  payload: {
    driverId: string;
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}

// Form validation types
export interface OTPRequest {
  phone: string;
}

export interface OTPVerification {
  phone: string;
  otp: string;
}

export interface CartItem {
  variantId: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CartItem[];
  addressId: string;
  couponCode?: string;
  paymentMethod: PaymentMethod;
}

export interface CheckoutEstimate {
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  estimatedDeliveryAt: Date;
}

// Notification types
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  userId?: string;
  userIds?: string[];
  role?: UserRole;
}

// Audit log types
export interface AuditLog extends BaseEntity {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}