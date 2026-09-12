import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BomModule } from '../bom/bom.module.js';
import { BankingRailDispatcher } from './banking-rail.dispatcher.js';
import { FinanceController } from './finance.controller.js';
import { FourWayMatchService } from './four-way-match.service.js';
import { JournalService } from './journal.service.js';

@Module({
  imports: [BomModule, AuthModule],
  controllers: [FinanceController],
  providers: [FourWayMatchService, JournalService, BankingRailDispatcher],
  exports: [FourWayMatchService, JournalService, BankingRailDispatcher],
})
export class FinanceModule {}
