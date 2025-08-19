// User and Authentication Types
export interface User {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export type UserRole = 'BUYER' | 'DRIVER' | 'OPERATIONS';

export interface UserProfile {
  id: string;
  userId: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: Address;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'system';
}

export interface NotificationSettings {
  orderUpdates: boolean;
  promotions: boolean;
  deliveryAlerts: boolean;
  systemMessages: boolean;
}

// Address Types
export interface Address {
  id: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  name?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: ProductCategory;
  brand?: string;
  images: string[];
  price: number;
  unit: string;
  weight?: number;
  dimensions?: ProductDimensions;
  isActive: boolean;
  stock: ProductStock[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  image?: string;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'inch';
}

export interface ProductStock {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  maxStockLevel: number;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyer: User;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  currency: string;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  consignments?: Consignment[];
}

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

// Consignment Types
export interface Consignment {
  id: string;
  consignmentNumber: string;
  orderId: string;
  order: Order;
  driverId?: string;
  driver?: User;
  status: ConsignmentStatus;
  items: ConsignmentItem[];
  pickupAddress: Address;
  deliveryAddress: Address;
  estimatedPickupTime?: string;
  actualPickupTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  distance?: number;
  route?: RoutePoint[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ConsignmentStatus = 
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export interface ConsignmentItem {
  id: string;
  consignmentId: string;
  orderItemId: string;
  orderItem: OrderItem;
  quantity: number;
  isDelivered: boolean;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  address?: string;
}

// Payment Types
export interface PaymentMethod {
  id: string;
  type: 'CARD' | 'UPI' | 'WALLET' | 'COD';
  provider?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  gatewayResponse?: any;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedAt: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  currency: string;
  updatedAt: string;
}

// Warehouse Types
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: Address;
  manager?: User;
  isActive: boolean;
  capacity?: number;
  currentUtilization?: number;
}

// Navigation Types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface NavigationRoute {
  distance: number;
  duration: number;
  points: RoutePoint[];
  instructions: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface LoginForm {
  phone: string;
}

export interface OTPForm {
  otp: string;
}

export interface ProfileForm {
  firstName: string;
  lastName: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface AddressForm {
  type: 'HOME' | 'WORK' | 'OTHER';
  name?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data?: T;
  loading: boolean;
  error?: string;
}