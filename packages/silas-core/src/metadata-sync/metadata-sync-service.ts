import type { CrdtFieldState } from '../runtime/types.js';

/**
 * Deterministic, conflict-free synchronization of non-finite field state
 * across offline/intermittently-connected clients — a last-writer-wins
 * register per (resourceId, field). Mechanism family C (non-finite half)
 * from the Patent Core Audit; pairs with LeaseService, which covers the
 * finite half.
 */
export class MetadataSyncService {
  private readonly fields = new Map<string, CrdtFieldState>();

  /** Records this device's own write. Always wins locally — it's this actor's latest known state. */
  applyLocal(resourceId: string, field: string, value: unknown, actorId: string, timestamp: number = Date.now()): CrdtFieldState {
    const state: CrdtFieldState = { resourceId, field, value, timestamp, actorId };
    this.fields.set(this.key(resourceId, field), state);
    return state;
  }

  get(resourceId: string, field: string): CrdtFieldState | undefined {
    return this.fields.get(this.key(resourceId, field));
  }

  getSnapshot(resourceId: string): CrdtFieldState[] {
    return [...this.fields.values()].filter((f) => f.resourceId === resourceId);
  }

  /**
   * Reconciles an incoming remote update against local state for the same
   * field. Last-writer-wins by timestamp, with actorId as a deterministic
   * tiebreaker when timestamps are equal — every device applies the same
   * rule, so all devices converge on the same value regardless of merge
   * order.
   */
  merge(remote: CrdtFieldState): CrdtFieldState {
    const localKey = this.key(remote.resourceId, remote.field);
    const local = this.fields.get(localKey);

    if (!local || this.remoteWins(remote, local)) {
      this.fields.set(localKey, remote);
      return remote;
    }

    return local;
  }

  private remoteWins(remote: CrdtFieldState, local: CrdtFieldState): boolean {
    if (remote.timestamp !== local.timestamp) {
      return remote.timestamp > local.timestamp;
    }
    return remote.actorId > local.actorId;
  }

  private key(resourceId: string, field: string): string {
    return `${resourceId}:${field}`;
  }
}
