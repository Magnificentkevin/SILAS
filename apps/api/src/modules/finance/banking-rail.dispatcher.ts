import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export type BankingRail = 'RTP' | 'SAME_DAY_ACH';

export interface BankingTransferPayload {
  rail: BankingRail;
  transactionReference: string;
  amountCents: number;
  initiatedAt: string;
  status: 'STUBBED';
}

/** Stub only — no real RTP/FedNow or Same-Day ACH network integration is wired up. */
@Injectable()
export class BankingRailDispatcher {
  dispatch(amountCents: number, rail: BankingRail = 'RTP'): BankingTransferPayload {
    return {
      rail,
      transactionReference: `${rail}-${randomUUID()}`,
      amountCents,
      initiatedAt: new Date().toISOString(),
      status: 'STUBBED',
    };
  }
}
