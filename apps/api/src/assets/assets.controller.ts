import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateAssetSchema, type CreateAsset } from '@repo/contracts';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard.js';
import { Roles } from '../modules/auth/roles.decorator.js';
import { RolesGuard } from '../modules/auth/roles.guard.js';
import { AssetsService } from './assets.service.js';

// Assets have no accountId of their own yet, so this can only be an
// internal-role check for now — not "which customer's asset is this."
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERATOR')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  findAll() {
    return this.assetsService.findAll();
  }

  @Post()
  create(@Body() body: unknown) {
    const asset: CreateAsset = CreateAssetSchema.parse(body);
    return this.assetsService.create(asset);
  }
}
