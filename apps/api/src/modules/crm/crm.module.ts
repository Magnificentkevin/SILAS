import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CrmController } from './crm.controller.js';
import { CrmPipelineService } from './crm-pipeline.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CrmController],
  providers: [CrmPipelineService],
  exports: [CrmPipelineService],
})
export class CrmModule {}
