// Export all types
export * from './types';

// Export all utilities
export * from './utils';

// Re-export commonly used items for convenience
export {
  UserRole,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ConsignmentStatus,
  KYCStatus,
  Language
} from './types';

export {
  CONSTANTS,
  formatPhone,
  validatePhone,
  validateGSTIN,
  validatePincode,
  generateOTP,
  generateOrderNumber,
  calculateGST,
  formatCurrency,
  formatDate,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError
} from './utils';

// Package version
export const VERSION = '1.0.0';