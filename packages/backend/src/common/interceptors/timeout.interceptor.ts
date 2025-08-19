import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly longRunningTimeout = 120000; // 2 minutes

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const timeoutDuration = this.getTimeoutForRequest(request);

    return next.handle().pipe(
      timeout(timeoutDuration),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () => new RequestTimeoutException(
              `Request timeout after ${timeoutDuration}ms`,
            ),
          );
        }
        return throwError(() => err);
      }),
    );
  }

  private getTimeoutForRequest(request: any): number {
    const { method, url } = request;

    // Long-running operations
    const longRunningPatterns = [
      '/files/upload',
      '/files/bulk-upload',
      '/admin/catalog/bulk-import',
      '/admin/inventory/bulk-update',
      '/admin/reports/generate',
      '/admin/exports/',
      '/payments/webhook',
    ];

    // Check if this is a long-running operation
    const isLongRunning = longRunningPatterns.some(pattern => 
      url.includes(pattern)
    );

    if (isLongRunning) {
      return this.longRunningTimeout;
    }

    // File upload operations
    if (method === 'POST' && url.includes('/upload')) {
      return this.longRunningTimeout;
    }

    // Bulk operations
    if (url.includes('/bulk')) {
      return this.longRunningTimeout;
    }

    // Report generation
    if (url.includes('/report') || url.includes('/export')) {
      return this.longRunningTimeout;
    }

    // Default timeout for regular operations
    return this.defaultTimeout;
  }
}