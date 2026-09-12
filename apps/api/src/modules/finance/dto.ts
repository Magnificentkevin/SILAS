import { IsBoolean, IsIn, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import type { SurfaceType } from '../bom/bom.engine.js';

export class SettlementMatchDto {
  @IsUUID()
  facilityId!: string;

  /** Which service run this settlement is for — telemetry evidence is
   *  scoped to this run, so a prior visit's pings can't validate today's
   *  unperformed work. */
  @IsUUID()
  runId!: string;

  /** Caller-supplied idempotency key (e.g. derived from the source invoice
   *  number) — a retried or concurrently-duplicated request with the same
   *  key returns the original settlement instead of posting a duplicate. */
  @IsString()
  settlementKey!: string;

  @IsBoolean()
  closetSupplyScanned!: boolean;

  @IsBoolean()
  coverageHeatmapComplete!: boolean;

  @IsNumber()
  @Min(0)
  invoicedAmountCents!: number;

  @IsNumber()
  @Min(0)
  squareFootage!: number;

  @IsIn(['FINISH', 'SCRUB'])
  surfaceType!: SurfaceType;

  @IsNumber()
  @Min(0)
  baseUnitCostCents!: number;
}
