import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      return this.getStatus(key, true, {
        database: 'up',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw this.getStatus(key, false, {
        database: 'down',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}