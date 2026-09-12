import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BaaComplianceService } from './baa-compliance.service.js';
import { BaaMedicalComplianceGuard } from './baa-medical-compliance.guard.js';
import { BidService } from './bid.service.js';
import { ComplianceController } from './compliance.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [ComplianceController],
  providers: [BaaComplianceService, BaaMedicalComplianceGuard, BidService],
  exports: [BaaComplianceService, BaaMedicalComplianceGuard, BidService],
})
export class ComplianceModule {}
