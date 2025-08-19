import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = (request as any).user?.id;
    const startTime = Date.now();

    // Generate request ID for tracking
    const requestId = this.generateRequestId();
    (request as any).requestId = requestId;

    // Log incoming request
    this.logger.log(
      `Incoming Request: ${method} ${url} - ${ip} - ${userAgent} - User: ${userId || 'Anonymous'} - RequestID: ${requestId}`,
    );

    // Log request body for non-GET requests (excluding sensitive data)
    if (method !== 'GET' && request.body) {
      const sanitizedBody = this.sanitizeRequestBody(request.body);
      this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)} - RequestID: ${requestId}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          
          this.logger.log(
            `Outgoing Response: ${method} ${url} - ${statusCode} - ${duration}ms - RequestID: ${requestId}`,
          );

          // Log response data in debug mode (excluding sensitive data)
          if (process.env.LOG_LEVEL === 'debug' && data) {
            const sanitizedData = this.sanitizeResponseData(data);
            this.logger.debug(`Response Data: ${JSON.stringify(sanitizedData)} - RequestID: ${requestId}`);
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          
          this.logger.error(
            `Error Response: ${method} ${url} - ${statusCode || 500} - ${duration}ms - ${error.message} - RequestID: ${requestId}`,
          );
        },
      }),
    );
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'otp',
      'pin',
      'cvv',
      'cardNumber',
      'accountNumber',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Handle nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeRequestBody(sanitized[key]);
      }
    }

    return sanitized;
  }

  private sanitizeResponseData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'otp',
      'pin',
      'cvv',
      'cardNumber',
      'accountNumber',
      'razorpayKeySecret',
      'jwtSecret',
    ];

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    if (Array.isArray(sanitized)) {
      return sanitized.map(item => this.sanitizeResponseData(item));
    }

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Handle nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeResponseData(sanitized[key]);
      }
    }

    return sanitized;
  }
}