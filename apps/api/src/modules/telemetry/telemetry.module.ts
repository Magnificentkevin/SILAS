import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TelemetryController } from './telemetry.controller.js';
import { TelemetryGateway } from './telemetry.gateway.js';
import { TelemetryService } from './telemetry.service.js';

@Module({
  imports: [AuthModule],
  controllers: [TelemetryController],
  providers: [TelemetryGateway, TelemetryService],
  exports: [TelemetryGateway, TelemetryService],
})
export class TelemetryModule {}
