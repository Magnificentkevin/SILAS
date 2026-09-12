import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SilasCoreController } from './silas-core.controller.js';
import { SilasCoreService } from './silas-core.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SilasCoreController],
  providers: [SilasCoreService],
  exports: [SilasCoreService],
})
export class SilasCoreModule {}
