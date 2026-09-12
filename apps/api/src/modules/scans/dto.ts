import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsISO8601, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class ScanEventDto {
  @IsString()
  clientScanId!: string;

  @IsString()
  barcode!: string;

  @IsISO8601()
  scannedAt!: string;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;
}

export class SyncScansDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScanEventDto)
  scans!: ScanEventDto[];
}
