import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';
import { encryptAccessPin, generateAccessPin } from './access-pin.crypto.js';

export const MIN_ROBOT_SOC_PERCENT = 85;

export interface FivePointLockInput {
  facilityId: string;
  robotSocPercent: number;
  materialsAllocated: boolean;
  quietHourClearance: boolean;
  subcontractorCoiOk: boolean;
  escrowPreauthOk: boolean;
}

export interface FivePointLockChecks {
  robotSocOk: boolean;
  materialsAllocatedOk: boolean;
  quietHourClearanceOk: boolean;
  subcontractorComplianceOk: boolean;
  escrowPreauthOk: boolean;
}

export interface FivePointLockResult {
  id: string;
  facilityId: string;
  status: 'LOCKED' | 'REJECTED';
  checks: FivePointLockChecks;
  /** Only present when status is LOCKED — the plaintext PIN is never persisted. */
  accessPin?: string;
}

@Injectable()
export class SchedulingLockService {
  /**
   * BAA acceptance is enforced upstream by BaaMedicalComplianceGuard on the controller route;
   * subcontractorCoiOk here covers the remaining Certificate-of-Insurance half of check #4.
   */
  async attemptLock(input: FivePointLockInput): Promise<FivePointLockResult> {
    const checks: FivePointLockChecks = {
      robotSocOk: input.robotSocPercent >= MIN_ROBOT_SOC_PERCENT,
      materialsAllocatedOk: input.materialsAllocated,
      quietHourClearanceOk: input.quietHourClearance,
      subcontractorComplianceOk: input.subcontractorCoiOk,
      escrowPreauthOk: input.escrowPreauthOk,
    };

    const allPassed = Object.values(checks).every(Boolean);

    if (!allPassed) {
      const rejected = await prisma.scheduleLock.create({
        data: {
          facilityId: input.facilityId,
          status: 'REJECTED',
          ...checks,
        },
      });

      return { id: rejected.id, facilityId: input.facilityId, status: 'REJECTED', checks };
    }

    const pin = generateAccessPin();
    const encryptedAccessPin = encryptAccessPin(pin);

    const locked = await prisma.scheduleLock.create({
      data: {
        facilityId: input.facilityId,
        status: 'LOCKED',
        lockedAt: new Date(),
        encryptedAccessPin,
        ...checks,
      },
    });

    return {
      id: locked.id,
      facilityId: input.facilityId,
      status: 'LOCKED',
      checks,
      accessPin: pin,
    };
  }
}
