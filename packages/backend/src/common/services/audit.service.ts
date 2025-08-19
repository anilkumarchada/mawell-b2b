import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@mawell/shared';

export interface AuditLogData {
  userId?: string;
  userRole?: UserRole;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          userRole: data.userRole,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      this.logger.log(
        `Audit log created: ${data.action} on ${data.resource} by user ${data.userId}`,
      );
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  async logCreate(
    resource: string,
    resourceId: string,
    newValues: Record<string, any>,
    userId?: string,
    userRole?: UserRole,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      action: 'CREATE',
      resource,
      resourceId,
      newValues,
      metadata,
    });
  }

  async logUpdate(
    resource: string,
    resourceId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    userId?: string,
    userRole?: UserRole,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      action: 'UPDATE',
      resource,
      resourceId,
      oldValues,
      newValues,
      metadata,
    });
  }

  async logDelete(
    resource: string,
    resourceId: string,
    oldValues: Record<string, any>,
    userId?: string,
    userRole?: UserRole,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      action: 'DELETE',
      resource,
      resourceId,
      oldValues,
      metadata,
    });
  }

  async logAccess(
    resource: string,
    resourceId?: string,
    userId?: string,
    userRole?: UserRole,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      action: 'ACCESS',
      resource,
      resourceId,
      metadata,
    });
  }

  async logLogin(
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      action: 'LOGIN',
      resource: 'AUTH',
      ipAddress,
      userAgent,
      metadata,
    });
  }

  async logLogout(
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      action: 'LOGOUT',
      resource: 'AUTH',
      ipAddress,
      userAgent,
      metadata,
    });
  }

  async logFailedLogin(
    phone: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
  ): Promise<void> {
    await this.log({
      action: 'FAILED_LOGIN',
      resource: 'AUTH',
      ipAddress,
      userAgent,
      metadata: {
        phone,
        reason,
      },
    });
  }

  async getAuditLogs(
    filters: {
      userId?: string;
      resource?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const {
      userId,
      resource,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (resource) where.resource = resource;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: logs.map(log => ({
        ...log,
        oldValues: log.oldValues || null,
        newValues: log.newValues || null,
        metadata: log.metadata || null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getResourceHistory(
    resource: string,
    resourceId: string,
    page = 1,
    limit = 20,
  ) {
    const where = {
      resource,
      resourceId,
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: logs.map(log => ({
        ...log,
        oldValues: log.oldValues || null,
        newValues: log.newValues || null,
        metadata: log.metadata || null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}