import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CommonModule,
  ],
  controllers: [MapsController],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}