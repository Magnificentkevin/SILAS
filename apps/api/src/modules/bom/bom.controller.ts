import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { BomEngine } from './bom.engine.js';
import { CalculateBomDto } from './dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERATOR')
@Controller('bom')
export class BomController {
  constructor(private readonly bomEngine: BomEngine) {}

  @Post('calculate')
  calculate(@Body() dto: CalculateBomDto) {
    return this.bomEngine.calculateLineItem(dto);
  }
}
