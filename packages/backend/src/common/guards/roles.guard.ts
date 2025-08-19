import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@mawell/shared';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is authenticated, deny access
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.includes(user.role);
    
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.role}`,
      );
    }

    // Additional role-specific checks
    return this.performAdditionalRoleChecks(user, requiredRoles, request);
  }

  private performAdditionalRoleChecks(
    user: any,
    requiredRoles: UserRole[],
    request: any,
  ): boolean {
    const { method, params, body } = request;

    // Admin can access everything
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Driver-specific checks
    if (user.role === UserRole.DRIVER) {
      // Drivers can only access their own consignments
      if (request.url.includes('/consignments/')) {
        const consignmentId = params.id;
        if (consignmentId && body?.driverId && body.driverId !== user.id) {
          throw new ForbiddenException(
            'Drivers can only access their own consignments',
          );
        }
      }

      // Drivers can only update their own location
      if (request.url.includes('/driver/location') && method === 'POST') {
        if (body?.driverId && body.driverId !== user.id) {
          throw new ForbiddenException(
            'Drivers can only update their own location',
          );
        }
      }
    }

    // Buyer-specific checks
    if (user.role === UserRole.BUYER) {
      // Buyers can only access their own orders
      if (request.url.includes('/orders/')) {
        const orderId = params.id;
        if (orderId && body?.buyerId && body.buyerId !== user.id) {
          throw new ForbiddenException(
            'Buyers can only access their own orders',
          );
        }
      }

      // Buyers can only access their own cart
      if (request.url.includes('/cart')) {
        if (body?.userId && body.userId !== user.id) {
          throw new ForbiddenException(
            'Buyers can only access their own cart',
          );
        }
      }

      // Buyers can only access their own addresses
      if (request.url.includes('/addresses/')) {
        if (body?.userId && body.userId !== user.id) {
          throw new ForbiddenException(
            'Buyers can only access their own addresses',
          );
        }
      }
    }

    // Ops-specific checks
    if (user.role === UserRole.OPS) {
      // Ops can only access warehouse operations they're assigned to
      if (request.url.includes('/warehouse/')) {
        const warehouseId = params.warehouseId || body?.warehouseId;
        if (warehouseId && user.assignedWarehouses) {
          const hasWarehouseAccess = user.assignedWarehouses.includes(warehouseId);
          if (!hasWarehouseAccess) {
            throw new ForbiddenException(
              'Access denied to this warehouse',
            );
          }
        }
      }
    }

    return true;
  }
}