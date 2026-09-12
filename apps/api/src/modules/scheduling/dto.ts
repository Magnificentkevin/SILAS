import { IsBoolean, IsNumber, IsUUID, Max, Min } from 'class-validator';

export class AttemptLockDto {
  @IsUUID()
  accountId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  robotSocPercent!: number;

  @IsBoolean()
  materialsAllocated!: boolean;

  @IsBoolean()
  quietHourClearance!: boolean;

  @IsBoolean()
  subcontractorCoiOk!: boolean;

  @IsBoolean()
  escrowPreauthOk!: boolean;
}
