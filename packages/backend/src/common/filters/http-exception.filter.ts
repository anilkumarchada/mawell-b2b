import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '@mawell/shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || exception.message;
        error = responseObj.error || exception.name;
        details = responseObj.details || null;

        // Handle validation errors
        if (Array.isArray(responseObj.message)) {
          message = 'Validation failed';
          details = responseObj.message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;

      // Handle specific error types
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
      } else if (exception.name === 'UnauthorizedError') {
        status = HttpStatus.UNAUTHORIZED;
      } else if (exception.name === 'ForbiddenError') {
        status = HttpStatus.FORBIDDEN;
      } else if (exception.name === 'NotFoundError') {
        status = HttpStatus.NOT_FOUND;
      } else if (exception.name === 'ConflictError') {
        status = HttpStatus.CONFLICT;
      } else if (exception.name === 'RateLimitError') {
        status = HttpStatus.TOO_MANY_REQUESTS;
      }
    }

    // Log the error
    const errorLog = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      error,
      message,
      details,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      userId: (request as any).user?.id,
    };

    if (status >= 500) {
      this.logger.error('Server Error:', errorLog);
      if (exception instanceof Error) {
        this.logger.error(exception.stack);
      }
    } else if (status >= 400) {
      this.logger.warn('Client Error:', errorLog);
    }

    // Prepare response
    const apiResponse: ApiResponse = {
      success: false,
      message,
      error,
      ...(details && { details }),
    };

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && status >= 500) {
      apiResponse.message = 'Internal server error';
      apiResponse.error = 'InternalServerError';
      delete apiResponse.details;
    }

    response.status(status).json({
      ...apiResponse,
      timestamp: new Date().toISOString(),
      path: request.url,
      statusCode: status,
    });
  }
}