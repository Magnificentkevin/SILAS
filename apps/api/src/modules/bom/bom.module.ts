import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BomController } from './bom.controller.js';
import { BomEngine } from './bom.engine.js';

@Module({
  imports: [AuthModule],
  controllers: [BomController],
  providers: [BomEngine],
  exports: [BomEngine],
})
export class BomModule {}
