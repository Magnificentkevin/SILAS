import { createHmac, randomUUID } from 'node:crypto';
import type { FiniteLease } from '../runtime/types.js';

export class LeaseDeniedError extends Error {
  constructor(resourceId: string, heldBy: string) {
    super(`Resource ${resourceId} is already leased by ${heldBy}`);
    this.name = 'LeaseDeniedError';
  }
}

/**
 * Pessimistic, signed, time-bounded leases for finite physical resources.
 * Mechanism family C (offline resource arbitration) from the Patent Core Audit.
 */
export class LeaseService {
  private readonly active = new Map<string, FiniteLease>();

  constructor(private readonly secret: string = 'silas-dev-secret') {}

  acquire(resourceId: string, holder: string, ttlMs: number): FiniteLease {
    const existing = this.active.get(resourceId);
    if (existing && existing.expiresAt > new Date()) {
      throw new LeaseDeniedError(resourceId, existing.holder);
    }

    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + ttlMs);
    const id = randomUUID();
    const signature = this.sign(id, resourceId, holder, expiresAt);
    const lease: FiniteLease = { id, resourceId, holder, issuedAt, expiresAt, signature };

    this.active.set(resourceId, lease);
    return lease;
  }

  /** Recomputes the signature independently rather than trusting the stored record. */
  verify(lease: FiniteLease): boolean {
    const expected = this.sign(lease.id, lease.resourceId, lease.holder, lease.expiresAt);
    return expected === lease.signature && lease.expiresAt > new Date();
  }

  release(lease: FiniteLease): void {
    const current = this.active.get(lease.resourceId);
    if (current?.id === lease.id) this.active.delete(lease.resourceId);
  }

  private sign(id: string, resourceId: string, holder: string, expiresAt: Date): string {
    return createHmac('sha256', this.secret)
      .update(`${id}:${resourceId}:${holder}:${expiresAt.toISOString()}`)
      .digest('hex');
  }
}
