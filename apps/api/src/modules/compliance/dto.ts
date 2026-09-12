import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AcceptBaaDto {
  @IsUUID()
  accountId!: string;
}

export class SubmitBidDto {
  @IsUUID()
  accountId!: string;

  @IsNumber()
  @Min(0)
  amountCents!: number;

  @IsOptional()
  @IsString()
  description?: string;
}
