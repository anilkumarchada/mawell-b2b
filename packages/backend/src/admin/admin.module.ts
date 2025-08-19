import { AdminController } from '@/admin/admin.controller';
import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { AdminService } from './admin.service';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    WarehousesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}