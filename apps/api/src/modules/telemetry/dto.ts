import { IsNumber, IsObject, IsUUID, Max, Min } from 'class-validator';
import type { Prisma } from '@repo/database';

export class TelemetryPingDto {
  @IsUUID()
  facilityId!: string;

  /** Which service run this ping is evidence for — settlement matching only
   *  ever counts pings tied to the specific run being settled. */
  @IsUUID()
  runId!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}

export class UpsertGeofenceDto {
  @IsUUID()
  facilityId!: string;

  @IsObject()
  polygonGeoJson!: Prisma.InputJsonValue;
}
