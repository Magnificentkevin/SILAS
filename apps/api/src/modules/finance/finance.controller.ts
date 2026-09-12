import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { BankingRailDispatcher } from './banking-rail.dispatcher.js';
import { SettlementMatchDto } from './dto.js';
import { FourWayMatchService } from './four-way-match.service.js';
import { JournalService } from './journal.service.js';

// Settlement posts real ledger entries and dispatches banking transfers —
// internal-only, and VERIFIER is included since this is exactly the kind
// of commitment the invention's "human verification" step exists for.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERATOR', 'VERIFIER')
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly matchService: FourWayMatchService,
    private readonly journalService: JournalService,
    private readonly bankingDispatcher: BankingRailDispatcher,
  ) {}

  @Post('settlements/match')
  async match(@Body() dto: SettlementMatchDto) {
    const matchResult = await this.matchService.evaluateMatch(dto);

    if (!matchResult.matched) {
      return { ...matchResult, journalEntry: null, transfer: null };
    }

    const journalEntry = await this.journalService.postSettlement(
      dto.invoicedAmountCents,
      `4-way match settlement for facility ${dto.facilityId}`,
      dto.settlementKey,
    );
    const transfer = this.bankingDispatcher.dispatch(dto.invoicedAmountCents);

    return { ...matchResult, journalEntry, transfer };
  }
}
