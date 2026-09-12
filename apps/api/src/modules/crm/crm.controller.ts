import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CrmPipelineService } from './crm-pipeline.service.js';
import {
  CreateAccountDto,
  CreateOpportunityDto,
  GrantMembershipDto,
  RecordRunDto,
  TransitionOpportunityDto,
} from './dto.js';

// The sales pipeline itself — every account, every opportunity, at once.
// This is never customer/vendor-facing; only internal staff see the pipeline.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERATOR')
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmPipelineService) {}

  @Post('accounts')
  createAccount(@Body() dto: CreateAccountDto) {
    return this.crmService.createAccount(dto.name, dto.isHealthcareSite);
  }

  @Get('accounts')
  listAccounts() {
    return this.crmService.listAccounts();
  }

  @Get('accounts/:id/health')
  getAccountHealth(@Param('id') id: string) {
    return this.crmService.getAccountHealth(id);
  }

  /** The only way a user gains access to an account's data — see grantMembership's docstring. */
  @Post('accounts/:id/memberships')
  grantMembership(@Param('id') id: string, @Body() dto: GrantMembershipDto) {
    return this.crmService.grantMembership(id, dto.userId, dto.role);
  }

  @Post('opportunities')
  createOpportunity(@Body() dto: CreateOpportunityDto) {
    return this.crmService.createOpportunity(dto.accountId);
  }

  @Get('opportunities')
  listOpportunities() {
    return this.crmService.listOpportunities();
  }

  @Get('runs')
  listRecentRuns() {
    return this.crmService.listRecentRuns();
  }

  @Patch('opportunities/:id/advance')
  advanceOpportunity(@Param('id') id: string) {
    return this.crmService.advanceOpportunity(id);
  }

  @Patch('opportunities/:id/stage')
  transitionOpportunity(@Param('id') id: string, @Body() dto: TransitionOpportunityDto) {
    return this.crmService.transitionOpportunity(id, dto.stage);
  }

  @Post('runs')
  recordRun(@Body() dto: RecordRunDto) {
    return this.crmService.recordRunOutcome(dto.accountId, dto.status);
  }
}
