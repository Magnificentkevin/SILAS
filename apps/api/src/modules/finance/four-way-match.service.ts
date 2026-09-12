import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { BomEngine, type SurfaceType } from '../bom/bom.engine.js';

export const MIN_TELEMETRY_PINGS_IN_GEOFENCE = 10;
export const BOM_VARIANCE_TOLERANCE = 0.02; // +/- 2.0%

export interface FourWayMatchInput {
  facilityId: string;
  runId: string;
  closetSupplyScanned: boolean;
  coverageHeatmapComplete: boolean;
  invoicedAmountCents: number;
  squareFootage: number;
  surfaceType: SurfaceType;
  baseUnitCostCents: number;
}

export interface FourWayMatchChecks {
  telemetryOk: boolean;
  telemetryPingsInGeofence: number;
  closetSupplyScannedOk: boolean;
  coverageHeatmapCompleteOk: boolean;
  invoiceWithinToleranceOk: boolean;
  recalculatedBomCostCents: number;
  invoicedAmountCents: number;
  variancePct: number;
}

export interface FourWayMatchResult {
  matched: boolean;
  checks: FourWayMatchChecks;
}

@Injectable()
export class FourWayMatchService {
  constructor(private readonly bomEngine: BomEngine) {}

  async evaluateMatch(input: FourWayMatchInput): Promise<FourWayMatchResult> {
    const run = await prisma.run.findUnique({ where: { id: input.runId } });
    if (!run) {
      throw new NotFoundException(`Unknown run: ${input.runId}`);
    }
    if (run.accountId !== input.facilityId) {
      throw new BadRequestException(`Run ${input.runId} does not belong to facility ${input.facilityId}`);
    }

    // Scoped to this specific run, not the facility in general — a prior
    // visit's telemetry must not be able to validate a different run's
    // (unperformed) work. See R04 in the external audit remediation.
    const telemetryPingsInGeofence = await prisma.telemetryPing.count({
      where: { runId: input.runId, isInsideGeofence: true },
    });
    const telemetryOk = telemetryPingsInGeofence >= MIN_TELEMETRY_PINGS_IN_GEOFENCE;

    const bomResult = await this.bomEngine.calculateLineItem({
      squareFootage: input.squareFootage,
      surfaceType: input.surfaceType,
      baseUnitCostCents: input.baseUnitCostCents,
    });
    const recalculatedBomCostCents = bomResult.totalCostCents;

    const variancePct = computeVariancePct(input.invoicedAmountCents, recalculatedBomCostCents);
    const invoiceWithinToleranceOk = variancePct <= BOM_VARIANCE_TOLERANCE;

    const checks: FourWayMatchChecks = {
      telemetryOk,
      telemetryPingsInGeofence,
      closetSupplyScannedOk: input.closetSupplyScanned,
      coverageHeatmapCompleteOk: input.coverageHeatmapComplete,
      invoiceWithinToleranceOk,
      recalculatedBomCostCents,
      invoicedAmountCents: input.invoicedAmountCents,
      variancePct,
    };

    const matched =
      telemetryOk &&
      checks.closetSupplyScannedOk &&
      checks.coverageHeatmapCompleteOk &&
      invoiceWithinToleranceOk;

    return { matched, checks };
  }
}

function computeVariancePct(invoicedCents: number, recalculatedCents: number): number {
  if (recalculatedCents === 0) {
    return invoicedCents === 0 ? 0 : Infinity;
  }
  return Math.abs(invoicedCents - recalculatedCents) / recalculatedCents;
}
