import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ComplianceModule } from '../compliance/compliance.module.js';
import { SchedulingController } from './scheduling.controller.js';
import { SchedulingLockService } from './scheduling-lock.service.js';

@Module({
  imports: [ComplianceModule, AuthModule],
  controllers: [SchedulingController],
  providers: [SchedulingLockService],
  exports: [SchedulingLockService],
})
export class SchedulingModule {}
