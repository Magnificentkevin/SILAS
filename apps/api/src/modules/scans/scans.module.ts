import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ScansController } from './scans.controller.js';
import { ScansService } from './scans.service.js';
import { VoiceNoteStorageService } from './voice-note-storage.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ScansController],
  providers: [ScansService, VoiceNoteStorageService],
})
export class ScansModule {}
