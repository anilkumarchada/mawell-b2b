import { Injectable, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  validatePhone,
  validateGSTIN,
  validatePincode,
  formatPhone,
} from '@mawell/shared';
import { Express } from 'express';
import 'multer';

@Injectable()
export class ValidationService {
  /**
   * Validate DTO using class-validator
   */
  async validateDto<T extends object>(
    dtoClass: new () => T,
    data: any,
  ): Promise<T> {
    const dto = plainToClass(dtoClass, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = this.formatValidationErrors(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    return dto;
  }

  /**
   * Mask phone number for logging
   */
  maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 4) {
      return '****';
    }
    const visibleDigits = 2;
    const maskedPart = '*'.repeat(phone.length - visibleDigits * 2);
    return phone.slice(0, visibleDigits) + maskedPart + phone.slice(-visibleDigits);
  }

  /**
   * Format validation errors for better readability
   */
  private formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    errors.forEach((error) => {
      const field = error.property;
      const messages: string[] = [];

      if (error.constraints) {
        Object.values(error.constraints).forEach((message) => {
          messages.push(message);
        });
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatValidationErrors(error.children);
        Object.keys(nestedErrors).forEach((nestedField) => {
          const fullField = `${field}.${nestedField}`;
          formattedErrors[fullField] = nestedErrors[nestedField];
        });
      }

      if (messages.length > 0) {
        formattedErrors[field] = messages;
      }
    });

    return formattedErrors;
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phone: string): { isValid: boolean; formatted?: string; error?: string } {
    if (!phone) {
      return { isValid: false, error: 'Phone number is required' };
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!validatePhone(cleanPhone)) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    return {
      isValid: true,
      formatted: formatPhone(cleanPhone),
    };
  }

  /**
   * Validate GSTIN
   */
  validateGSTIN(gstin: string): { isValid: boolean; error?: string } {
    if (!gstin) {
      return { isValid: false, error: 'GSTIN is required' };
    }

    if (!validateGSTIN(gstin)) {
      return { isValid: false, error: 'Invalid GSTIN format' };
    }

    return { isValid: true };
  }

  /**
   * Validate pincode
   */
  validatePincode(pincode: string): { isValid: boolean; error?: string } {
    if (!pincode) {
      return { isValid: false, error: 'Pincode is required' };
    }

    if (!validatePincode(pincode)) {
      return { isValid: false, error: 'Invalid pincode format' };
    }

    return { isValid: true };
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; score: number; errors: string[] } {
    const errors: string[] = [];
    let score = 0;

    if (!password) {
      return { isValid: false, score: 0, errors: ['Password is required'] };
    }

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    // Uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Common patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common patterns');
        score = Math.max(0, score - 1);
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      score,
      errors,
    };
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }

    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  /**
   * Validate file upload
   */
  validateFileUpload(
    file: Express.Multer.File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {},
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
    } = options;

    if (!file) {
      errors.push('File is required');
      return { isValid: false, errors };
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
    }

    // Check MIME type
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check file extension
    const fileExtension = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension ${fileExtension} is not allowed`);
    }

    // Check for malicious file names
    if (this.containsMaliciousPatterns(file.originalname)) {
      errors.push('File name contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for malicious patterns in file names
   */
  private containsMaliciousPatterns(filename: string): boolean {
    const maliciousPatterns = [
      /\.\.\//,  // Directory traversal
      /\\\.\.\\/, // Windows directory traversal
      /<script/i, // Script tags
      /javascript:/i, // JavaScript protocol
      /vbscript:/i, // VBScript protocol
      /on\w+=/i, // Event handlers
    ];

    return maliciousPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(
    latitude: number,
    longitude: number,
  ): { isValid: boolean; error?: string } {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return { isValid: false, error: 'Coordinates must be numbers' };
    }

    if (latitude < -90 || latitude > 90) {
      return { isValid: false, error: 'Latitude must be between -90 and 90' };
    }

    if (longitude < -180 || longitude > 180) {
      return { isValid: false, error: 'Longitude must be between -180 and 180' };
    }

    return { isValid: true };
  }

  /**
   * Validate date range
   */
  validateDateRange(
    startDate: Date,
    endDate: Date,
    maxDays?: number,
  ): { isValid: boolean; error?: string } {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      return { isValid: false, error: 'Invalid date format' };
    }

    if (startDate > endDate) {
      return { isValid: false, error: 'Start date must be before end date' };
    }

    if (maxDays) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > maxDays) {
        return { isValid: false, error: `Date range cannot exceed ${maxDays} days` };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate pagination parameters
   */
  validatePagination(
    page: number,
    limit: number,
    maxLimit = 100,
  ): { isValid: boolean; error?: string; page: number; limit: number } {
    const validPage = Math.max(1, Math.floor(page) || 1);
    const validLimit = Math.max(1, Math.min(maxLimit, Math.floor(limit) || 10));

    return {
      isValid: true,
      page: validPage,
      limit: validLimit,
    };
  }
}