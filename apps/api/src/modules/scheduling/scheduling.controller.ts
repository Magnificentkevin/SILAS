import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { BaaMedicalComplianceGuard } from '../compliance/baa-medical-compliance.guard.js';
import { AttemptLockDto } from './dto.js';
import { SchedulingLockService } from './scheduling-lock.service.js';

@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly lockService: SchedulingLockService) {}

  /**
   * BaaMedicalComplianceGuard blocks this route entirely for healthcare-site accounts
   * without a current BAA acceptance, before the 5-point checks are even evaluated.
   * RolesGuard runs first and checks dto.accountId, so HOST_CLIENT only ever
   * commits a lock for their own facility, never someone else's.
   */
  @Post('locks')
  @UseGuards(JwtAuthGuard, RolesGuard, BaaMedicalComplianceGuard)
  @Roles('ADMIN', 'OPERATOR', 'HOST_CLIENT')
  attemptLock(@Body() dto: AttemptLockDto) {
    return this.lockService.attemptLock({
      facilityId: dto.accountId,
      robotSocPercent: dto.robotSocPercent,
      materialsAllocated: dto.materialsAllocated,
      quietHourClearance: dto.quietHourClearance,
      subcontractorCoiOk: dto.subcontractorCoiOk,
      escrowPreauthOk: dto.escrowPreauthOk,
    });
  }
}
