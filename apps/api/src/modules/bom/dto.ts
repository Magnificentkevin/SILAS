import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { SurfaceType } from './bom.engine.js';

export class CalculateBomDto {
  @IsNumber()
  @Min(0)
  squareFootage!: number;

  @IsIn(['FINISH', 'SCRUB'])
  surfaceType!: SurfaceType;

  @IsNumber()
  @Min(0)
  baseUnitCostCents!: number;

  @IsOptional()
  @IsString()
  ppiSeriesCode?: string;
}
