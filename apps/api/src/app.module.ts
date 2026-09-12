import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AssetsModule } from './assets/assets.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BomModule } from './modules/bom/bom.module.js';
import { ComplianceModule } from './modules/compliance/compliance.module.js';
import { CrmModule } from './modules/crm/crm.module.js';
import { FinanceModule } from './modules/finance/finance.module.js';
import { IntegrationsModule } from './modules/integrations/integrations.module.js';
import { ScansModule } from './modules/scans/scans.module.js';
import { SchedulingModule } from './modules/scheduling/scheduling.module.js';
import { SilasCoreModule } from './modules/silas-core/silas-core.module.js';
import { TelemetryModule } from './modules/telemetry/telemetry.module.js';

@Module({
  imports: [
    AuthModule,
    AssetsModule,
    BomModule,
    ComplianceModule,
    CrmModule,
    TelemetryModule,
    SchedulingModule,
    FinanceModule,
    SilasCoreModule,
    IntegrationsModule,
    ScansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
