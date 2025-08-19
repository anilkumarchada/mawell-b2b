import { KycController } from '@/kyc/kyc.controller';
import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { PrismaModule } from '../prisma/prisma.module';
import { KycService } from './kyc.service';

@Module({
  imports: [PrismaModule, FilesModule],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}