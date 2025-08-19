import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Note: Event handlers are commented out due to TypeScript compatibility issues
    // with the current Prisma version. Enable when needed and properly typed.
    
    // Log queries in development
    // if (configService.get('NODE_ENV') === 'development') {
    //   this.$on('query', (e: any) => {
    //     this.logger.debug(`Query: ${e.query}`);
    //     this.logger.debug(`Params: ${e.params}`);
    //     this.logger.debug(`Duration: ${e.duration}ms`);
    //   });
    // }

    // this.$on('error', (e: any) => {
    //   this.logger.error('Prisma error:', e);
    // });

    // this.$on('info', (e: any) => {
    //   this.logger.log('Prisma info:', e.message);
    // });

    // this.$on('warn', (e: any) => {
    //   this.logger.warn('Prisma warning:', e.message);
    // });
    
    this.logger.log('Prisma service initialized');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.warn('Failed to connect to database, continuing without database:', error.message);
      // Don't throw error to allow app to start without database
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from database');
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error);
    }
  }

  async enableShutdownHooks(app: any) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  // Transaction helper
  async executeTransaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }

  // Soft delete helper
  async softDelete(model: string, where: any) {
    const modelDelegate = (this as any)[model];
    if (!modelDelegate) {
      throw new Error(`Model ${model} not found`);
    }

    return modelDelegate.update({
      where,
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  // Pagination helper
  async paginate<T>(
    model: string,
    {
      page = 1,
      limit = 20,
      where = {},
      orderBy = {},
      include = {},
      select = {},
    }: {
      page?: number;
      limit?: number;
      where?: any;
      orderBy?: any;
      include?: any;
      select?: any;
    } = {},
  ): Promise<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const modelDelegate = (this as any)[model];
    if (!modelDelegate) {
      throw new Error(`Model ${model} not found`);
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [items, total] = await Promise.all([
      modelDelegate.findMany({
        where,
        orderBy,
        include,
        select: Object.keys(select).length > 0 ? select : undefined,
        skip,
        take,
      }),
      modelDelegate.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Bulk operations helper
  async bulkCreate<T>(model: string, data: T[]): Promise<{ count: number }> {
    const modelDelegate = (this as any)[model];
    if (!modelDelegate) {
      throw new Error(`Model ${String(model)} not found`);
    }

    return modelDelegate.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // Search helper with full-text search
  async search<T>(
    model: string,
    {
      query,
      fields,
      page = 1,
      limit = 20,
      where = {},
      orderBy = {},
      include = {},
    }: {
      query: string;
      fields: string[];
      page?: number;
      limit?: number;
      where?: any;
      orderBy?: any;
      include?: any;
    },
  ): Promise<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const searchConditions = fields.map((field) => ({
      [field]: {
        contains: query,
        mode: 'insensitive',
      },
    }));

    const searchWhere = {
      ...where,
      OR: searchConditions,
    };

    return this.paginate(model, {
      page,
      limit,
      where: searchWhere,
      orderBy,
      include,
    });
  }
}