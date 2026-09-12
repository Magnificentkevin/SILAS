import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/jwt-payload.js';
import { SyncScansDto } from './dto.js';
import { ScansService } from './scans.service.js';

@Controller('scans')
@UseGuards(JwtAuthGuard)
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post('sync')
  sync(@Body() dto: SyncScansDto, @CurrentUser() user: JwtPayload) {
    return this.scansService.sync(dto, user.sub);
  }

  @Post(':clientScanId/voice-note')
  async uploadVoiceNote(
    @Param('clientScanId') clientScanId: string,
    @Req() request: FastifyRequest,
    @CurrentUser() user: JwtPayload,
  ) {
    const file = await request.file();
    if (!file) {
      throw new BadRequestException('No file field found in the multipart request');
    }
    return this.scansService.attachVoiceNote(clientScanId, file, user);
  }

  // A short-lived signed URL to the voice note's actual bytes, not the file
  // itself -- replaces what used to be an unauthenticated public static path.
  @Get(':clientScanId/voice-note')
  getVoiceNoteUrl(@Param('clientScanId') clientScanId: string, @CurrentUser() user: JwtPayload) {
    return this.scansService.getVoiceNoteDownloadUrl(clientScanId, user);
  }
}
