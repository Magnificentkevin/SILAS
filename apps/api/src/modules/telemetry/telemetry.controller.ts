import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { TelemetryService } from './telemetry.service.js';
import { TelemetryPingDto, UpsertGeofenceDto } from './dto.js';

// Previously had no guard at all -- anyone on the internet could post fake
// location pings or rewrite a facility's geofence polygon. Requiring
// authentication is the minimal fix; further role-scoping (e.g. which
// specific roles should ping) is a separate decision this doesn't guess at.
@Controller('api/v1/telemetry')
@UseGuards(JwtAuthGuard)
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('ping')
  ping(@Body() dto: TelemetryPingDto) {
    return this.telemetryService.recordPing(dto);
  }

  @Post('geofences')
  upsertGeofence(@Body() dto: UpsertGeofenceDto) {
    return this.telemetryService.upsertGeofence(dto.facilityId, dto.polygonGeoJson);
  }
}
