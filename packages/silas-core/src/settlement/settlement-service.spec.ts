import { describe, expect, it } from 'vitest';
import {
  SettlementAlreadyFinalizedError,
  SettlementNotFoundError,
  SettlementNotVerifiedError,
  SettlementService,
} from './settlement-service.js';

describe('SettlementService', () => {
  it('places an authorization hold in the HELD state', () => {
    const service = new SettlementService();
    const hold = service.hold('order-1', 5_000, 'USD');

    expect(hold.status).toBe('HELD');
    expect(hold.amountCents).toBe(5_000);
  });

  it('throws SettlementNotFoundError for an unknown hold id', () => {
    const service = new SettlementService();
    expect(() => service.get('does-not-exist')).toThrow(SettlementNotFoundError);
  });

  it('moves a HELD hold to VERIFIED and records who approved it', () => {
    const service = new SettlementService();
    const hold = service.hold('order-1', 5_000, 'USD');
    const verified = service.verify(hold.id, 'verifier-jane');

    expect(verified.status).toBe('VERIFIED');
    expect(verified.verifiedBy).toBe('verifier-jane');
  });

  it('refuses to re-verify a hold that has already been released', () => {
    const service = new SettlementService();
    const hold = service.hold('order-1', 5_000, 'USD');
    service.release(hold.id);

    expect(() => service.verify(hold.id, 'verifier-jane')).toThrow(SettlementAlreadyFinalizedError);
  });

  describe('capture', () => {
    it('captures a verified hold, moving it to CAPTURED', () => {
      const service = new SettlementService();
      const hold = service.hold('order-1', 5_000, 'USD');
      service.verify(hold.id, 'verifier-jane');

      const captured = service.capture(hold.id);
      expect(captured.status).toBe('CAPTURED');
      expect(captured.capturedAt).toBeInstanceOf(Date);
    });

    it('refuses to capture a hold that has not been verified yet', () => {
      const service = new SettlementService();
      const hold = service.hold('order-1', 5_000, 'USD');

      expect(() => service.capture(hold.id)).toThrow(SettlementNotVerifiedError);
    });

    it('refuses to capture a hold that has already been released', () => {
      const service = new SettlementService();
      const hold = service.hold('order-1', 5_000, 'USD');
      service.release(hold.id);

      expect(() => service.capture(hold.id)).toThrow(SettlementAlreadyFinalizedError);
    });

    it('is idempotent: capturing an already-captured hold returns it unchanged rather than throwing', () => {
      const service = new SettlementService();
      const hold = service.hold('order-1', 5_000, 'USD');
      service.verify(hold.id, 'verifier-jane');

      const first = service.capture(hold.id);
      const second = service.capture(hold.id);

      expect(second.status).toBe('CAPTURED');
      expect(second.capturedAt).toEqual(first.capturedAt);
    });
  });

  describe('release', () => {
    it('releases a HELD hold — the failure-path inverse, before verification', () => {
      const service = new SettlementService();
      const hold = service.hold('order-1', 5_000, 'USD');
      const released = service.release(hold.id);

      expect(released.status).toBe('RELEASED');
      expect(released.releasedAt).toBeInstanceOf(Date);
    });

    it('also releases a VERIFIED hold that was never captured', () => {
      const service = new SettlementService();
      const hold = service.hold('order-1', 5_000, 'USD');
      service.verify(hold.id, 'verifier-jane');

      expect(service.release(hold.id).status).toBe('RELEASED');
    });

    it('refuses to release a hold that has already been captured', () => {
      const service = new SettlementService();
      const hold = service.hold('order-1', 5_000, 'USD');
      service.verify(hold.id, 'verifier-jane');
      service.capture(hold.id);

      expect(() => service.release(hold.id)).toThrow(SettlementAlreadyFinalizedError);
    });
  });
});
