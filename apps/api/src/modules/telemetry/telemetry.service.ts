import { Injectable } from '@nestjs/common';
import { prisma, type Prisma } from '@repo/database';
import { TelemetryGateway } from './telemetry.gateway.js';

export interface TelemetryPingInput {
  facilityId: string;
  runId: string;
  lat: number;
  lng: number;
}

export interface TelemetryPingResult {
  facilityId: string;
  lat: number;
  lng: number;
  isInsideGeofence: boolean;
}

@Injectable()
export class TelemetryService {
  constructor(private readonly gateway: TelemetryGateway) {}

  async recordPing(input: TelemetryPingInput): Promise<TelemetryPingResult> {
    const isInsideGeofence = await this.checkGeofenceContainment(
      input.facilityId,
      input.lat,
      input.lng,
    );

    await prisma.telemetryPing.create({
      data: {
        facilityId: input.facilityId,
        runId: input.runId,
        lat: input.lat,
        lng: input.lng,
        isInsideGeofence,
      },
    });

    const result: TelemetryPingResult = { ...input, isInsideGeofence };
    this.gateway.emitTelemetryUpdate(input.facilityId, result);

    return result;
  }

  async upsertGeofence(facilityId: string, polygonGeoJson: Prisma.InputJsonValue) {
    return prisma.facilityGeofence.upsert({
      where: { facilityId },
      update: { polygonGeoJson },
      create: { facilityId, polygonGeoJson },
    });
  }

  private async checkGeofenceContainment(
    facilityId: string,
    lat: number,
    lng: number,
  ): Promise<boolean> {
    const rows = await prisma.$queryRaw<{ is_inside: boolean | null }[]>`
      SELECT ST_Contains(
        ST_SetSRID(ST_GeomFromGeoJSON(g."polygonGeoJson"->>'geometry'), 4326),
        ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)
      ) AS is_inside
      FROM facility_geofences g WHERE g."facilityId" = ${facilityId}
    `;

    return rows[0]?.is_inside ?? false;
  }
}
