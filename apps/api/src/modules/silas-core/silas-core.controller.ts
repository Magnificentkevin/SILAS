import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { RunDemoDto } from './dto.js';
import { SilasCoreService } from './silas-core.service.js';

// Reference-implementation demo of the invention spine itself — internal only.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERATOR')
@Controller('silas-core')
export class SilasCoreController {
  constructor(private readonly silasCoreService: SilasCoreService) {}

  @Post('demo/golden-path')
  runGoldenPath(@Body() dto: RunDemoDto) {
    return this.silasCoreService.runGoldenPath(dto.resourceId);
  }

  @Post('demo/failure-path')
  runFailurePath(@Body() dto: RunDemoDto) {
    return this.silasCoreService.runFailurePath(dto.resourceId);
  }

  @Get('audit/chain')
  getAuditChain() {
    return this.silasCoreService.getAuditChain();
  }

  @Get('audit/verify')
  verifyAuditChain() {
    return this.silasCoreService.verifyAuditChain();
  }
}
