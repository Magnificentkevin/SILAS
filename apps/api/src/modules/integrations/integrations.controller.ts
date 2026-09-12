import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  CreateConnectionDto,
  DispatchConnectionDto,
  ListConnectionsQueryDto,
  ListProvidersQueryDto,
} from './dto.js';
import { IntegrationsService } from './integrations.service.js';

// Every connection is now attributed to the account it belongs to
// (IntegrationConnection.accountId), but access here is still staff-only —
// ADMIN/OPERATOR have blanket visibility across accounts everywhere else in
// this codebase, so this doesn't yet enforce a per-account boundary against
// the caller. It sets the data up correctly for the day a VENDOR/HOST_CLIENT
// -facing endpoint is built on top of it, which is when that boundary
// actually needs enforcing.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERATOR')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('providers')
  listProviders(@Query() query: ListProvidersQueryDto) {
    return this.integrationsService.listProviders(query.category);
  }

  @Post('connections')
  createConnection(@Body() dto: CreateConnectionDto) {
    return this.integrationsService.createConnection(dto);
  }

  @Get('connections')
  listConnections(@Query() query: ListConnectionsQueryDto) {
    return this.integrationsService.listConnections(query.accountId);
  }

  @Post('connections/:id/verify')
  verifyConnection(@Param('id') id: string) {
    return this.integrationsService.verifyConnection(id);
  }

  @Patch('connections/:id/revoke')
  revokeConnection(@Param('id') id: string) {
    return this.integrationsService.revokeConnection(id);
  }

  @Post('connections/:id/dispatch')
  dispatch(@Param('id') id: string, @Body() dto: DispatchConnectionDto) {
    return this.integrationsService.dispatch(id, dto);
  }
}
