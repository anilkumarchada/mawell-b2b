import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@mawell/shared';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        // Skip transformation for certain routes or content types
        if (this.shouldSkipTransformation(request, response, data)) {
          return data;
        }

        // Handle different response types
        if (this.isAlreadyTransformed(data)) {
          return data;
        }

        // Handle file downloads
        if (this.isFileResponse(response)) {
          return data;
        }

        // Handle paginated responses
        if (this.isPaginatedResponse(data)) {
          return {
            success: true,
            data: data.items,
            meta: {
              total: data.total,
              page: data.page,
              limit: data.limit,
              totalPages: data.totalPages,
            },
          };
        }

        // Handle empty responses
        if (data === null || data === undefined) {
          return {
            success: true,
            message: this.getSuccessMessage(request.method),
          };
        }

        // Standard transformation
        return {
          success: true,
          data,
          message: this.getSuccessMessage(request.method, data),
        };
      }),
    );
  }

  private shouldSkipTransformation(request: any, response: any, _data: any): boolean {
    // Skip for health check endpoints
    if (request.url.includes('/health')) {
      return true;
    }

    // Skip for Swagger documentation
    if (request.url.includes('/docs') || request.url.includes('/swagger')) {
      return true;
    }

    // Skip for file uploads/downloads
    if (response.getHeader('content-type')?.includes('application/octet-stream')) {
      return true;
    }

    // Skip for SSE (Server-Sent Events)
    if (response.getHeader('content-type')?.includes('text/event-stream')) {
      return true;
    }

    return false;
  }

  private isAlreadyTransformed(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      typeof data.success === 'boolean'
    );
  }

  private isFileResponse(response: any): boolean {
    const contentType = response.getHeader('content-type');
    const contentDisposition = response.getHeader('content-disposition');
    
    return (
      contentDisposition?.includes('attachment') ||
      contentType?.includes('application/pdf') ||
      contentType?.includes('image/') ||
      contentType?.includes('application/octet-stream')
    );
  }

  private isPaginatedResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'items' in data &&
      'total' in data &&
      'page' in data &&
      'limit' in data &&
      'totalPages' in data &&
      Array.isArray(data.items)
    );
  }

  private getSuccessMessage(method: string, data?: any): string {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'Resource created successfully';
      case 'PUT':
      case 'PATCH':
        return 'Resource updated successfully';
      case 'DELETE':
        return 'Resource deleted successfully';
      case 'GET':
        if (Array.isArray(data)) {
          return `Retrieved ${data.length} record(s) successfully`;
        }
        return 'Resource retrieved successfully';
      default:
        return 'Operation completed successfully';
    }
  }
}