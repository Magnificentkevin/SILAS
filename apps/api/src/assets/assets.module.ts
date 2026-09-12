import { Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module.js';
import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}
