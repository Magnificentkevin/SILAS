import { createHash } from 'node:crypto';
import type { SealedAuditEvent } from '../runtime/types.js';

const GENESIS_HASH = '0'.repeat(64);

/**
 * Append-only, hash-linked audit chain binding transaction/state/attestation
 * evidence. Part of mechanism family E from the Patent Core Audit.
 */
export class AuditVault {
  private readonly chain: SealedAuditEvent[] = [];

  append(type: string, payload: unknown): SealedAuditEvent {
    const prevHash = this.chain.length ? this.chain[this.chain.length - 1]!.hash : GENESIS_HASH;
    const index = this.chain.length;
    const at = new Date().toISOString();
    const hash = this.computeHash(index, type, payload, at, prevHash);

    const event: SealedAuditEvent = { index, type, payload, at, prevHash, hash };
    this.chain.push(event);
    return event;
  }

  getChain(): readonly SealedAuditEvent[] {
    return this.chain;
  }

  /** Independent verifier: recomputes every hash from stored fields alone. */
  verify(): { ok: boolean; brokenAtIndex?: number } {
    let prevHash = GENESIS_HASH;

    for (const event of this.chain) {
      const expected = this.computeHash(event.index, event.type, event.payload, event.at, prevHash);
      if (expected !== event.hash || event.prevHash !== prevHash) {
        return { ok: false, brokenAtIndex: event.index };
      }
      prevHash = event.hash;
    }

    return { ok: true };
  }

  private computeHash(index: number, type: string, payload: unknown, at: string, prevHash: string): string {
    return createHash('sha256').update(JSON.stringify({ index, type, payload, at, prevHash })).digest('hex');
  }
}
