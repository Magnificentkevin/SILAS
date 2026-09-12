import { randomUUID } from 'node:crypto';
import type { SettlementHold, SettlementStatus } from '../runtime/types.js';

export class SettlementNotFoundError extends Error {
  constructor(id: string) {
    super(`No settlement hold found with id ${id}`);
    this.name = 'SettlementNotFoundError';
  }
}

export class SettlementAlreadyFinalizedError extends Error {
  constructor(id: string, status: SettlementStatus) {
    super(`Settlement hold ${id} is already ${status} and cannot be changed`);
    this.name = 'SettlementAlreadyFinalizedError';
  }
}

export class SettlementNotVerifiedError extends Error {
  constructor(id: string) {
    super(`Settlement hold ${id} must be verified by an authorized approver before it can be captured`);
    this.name = 'SettlementNotVerifiedError';
  }
}

/**
 * Two-phase payment authorization with a staged, reversible journal state and
 * a human verification gate between authorization and capture. Mechanism
 * family E (settlement half) from the Patent Core Audit.
 */
export class SettlementService {
  private readonly holds = new Map<string, SettlementHold>();

  /** Places an authorization hold and stages it; nothing is posted to a real ledger yet. */
  hold(reference: string, amountCents: number, currency: string): SettlementHold {
    const settlementHold: SettlementHold = {
      id: randomUUID(),
      reference,
      amountCents,
      currency,
      status: 'HELD',
      heldAt: new Date(),
    };
    this.holds.set(settlementHold.id, settlementHold);
    return settlementHold;
  }

  get(holdId: string): SettlementHold {
    const hold = this.holds.get(holdId);
    if (!hold) throw new SettlementNotFoundError(holdId);
    return hold;
  }

  /** Records an authorized verifier's approval. Does not itself move money. */
  verify(holdId: string, verifierId: string): SettlementHold {
    const hold = this.get(holdId);
    if (hold.status !== 'HELD') {
      throw new SettlementAlreadyFinalizedError(holdId, hold.status);
    }

    const verified: SettlementHold = {
      ...hold,
      status: 'VERIFIED',
      verifiedBy: verifierId,
      verifiedAt: new Date(),
    };
    this.holds.set(holdId, verified);
    return verified;
  }

  /**
   * Commits a verified hold to CAPTURED. Idempotent on an already-captured
   * hold — mirrors a real payment processor's capture semantics (e.g.
   * Stripe's PaymentIntent.capture), so this matches the behavior a future
   * provider adapter will actually have.
   */
  capture(holdId: string): SettlementHold {
    const hold = this.get(holdId);

    if (hold.status === 'CAPTURED') {
      return hold;
    }
    if (hold.status === 'RELEASED') {
      throw new SettlementAlreadyFinalizedError(holdId, hold.status);
    }
    if (hold.status === 'HELD') {
      throw new SettlementNotVerifiedError(holdId);
    }

    const captured: SettlementHold = {
      ...hold,
      status: 'CAPTURED',
      capturedAt: new Date(),
    };
    this.holds.set(holdId, captured);
    return captured;
  }

  /** Releases the hold without capturing it — the failure-path inverse. Legal from HELD or VERIFIED. */
  release(holdId: string): SettlementHold {
    const hold = this.get(holdId);
    if (hold.status === 'CAPTURED' || hold.status === 'RELEASED') {
      throw new SettlementAlreadyFinalizedError(holdId, hold.status);
    }

    const released: SettlementHold = {
      ...hold,
      status: 'RELEASED',
      releasedAt: new Date(),
    };
    this.holds.set(holdId, released);
    return released;
  }
}
