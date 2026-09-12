import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';

export type SurfaceType = 'FINISH' | 'SCRUB';

/** Applied to raw yield-derived gallons to cover overspray and application loss. */
export const WASTE_BUFFER_MULTIPLIER = 1.05;

/** Coverage rate per surface treatment, in square feet per gallon. */
export const SURFACE_YIELD_SQFT_PER_GALLON: Record<SurfaceType, number> = {
  FINISH: 2000,
  SCRUB: 15000,
};

export const DEFAULT_PPI_SERIES_CODE = 'PPI_CHEM_DEFAULT';

export interface BomLineItemInput {
  squareFootage: number;
  surfaceType: SurfaceType;
  baseUnitCostCents: number;
  ppiSeriesCode?: string;
}

export interface BomLineItemResult {
  surfaceType: SurfaceType;
  squareFootage: number;
  yieldSqftPerGallon: number;
  gallonsRequired: number;
  ppiMultiplier: number;
  adjustedUnitCostCents: number;
  totalCostCents: number;
}

@Injectable()
export class BomEngine {
  async calculateLineItem(input: BomLineItemInput): Promise<BomLineItemResult> {
    const yieldSqftPerGallon = SURFACE_YIELD_SQFT_PER_GALLON[input.surfaceType];
    const baseGallons = input.squareFootage / yieldSqftPerGallon;
    const gallonsRequired = round2(baseGallons * WASTE_BUFFER_MULTIPLIER);

    const ppiMultiplier = await this.getLatestPpiMultiplier(input.ppiSeriesCode);
    const adjustedUnitCostCents = Math.round(input.baseUnitCostCents * ppiMultiplier);
    const totalCostCents = Math.round(gallonsRequired * adjustedUnitCostCents);

    return {
      surfaceType: input.surfaceType,
      squareFootage: input.squareFootage,
      yieldSqftPerGallon,
      gallonsRequired,
      ppiMultiplier,
      adjustedUnitCostCents,
      totalCostCents,
    };
  }

  /** Looks up the most recent PPI multiplier effective at or before now for the given series. */
  async getLatestPpiMultiplier(seriesCode: string = DEFAULT_PPI_SERIES_CODE): Promise<number> {
    const latest = await prisma.inflationIndexLog.findFirst({
      where: { seriesCode, effectiveAt: { lte: new Date() } },
      orderBy: { effectiveAt: 'desc' },
    });

    return latest ? Number(latest.multiplier) : 1;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
