import { describe, expect, it } from 'vitest';
import { LeaseDeniedError, LeaseService } from './lease-service.js';

describe('LeaseService', () => {
  it('grants a lease with a verifiable signature and an expiry in the future', () => {
    const service = new LeaseService();
    const lease = service.acquire('robot-7', 'client-a', 60_000);

    expect(lease.resourceId).toBe('robot-7');
    expect(lease.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(service.verify(lease)).toBe(true);
  });

  it('denies a second client competing for the same finite resource while the lease is active', () => {
    const service = new LeaseService();
    const clientA = service.acquire('robot-7', 'client-a', 60_000);

    expect(() => service.acquire('robot-7', 'client-b', 60_000)).toThrow(LeaseDeniedError);
    expect(service.verify(clientA)).toBe(true);
  });

  it('lets a second client acquire the resource once the first lease is released', () => {
    const service = new LeaseService();
    const clientA = service.acquire('robot-7', 'client-a', 60_000);
    service.release(clientA);

    const clientB = service.acquire('robot-7', 'client-b', 60_000);
    expect(clientB.holder).toBe('client-b');
  });

  it('lets a second client acquire the resource once the first lease expires', async () => {
    const service = new LeaseService();
    service.acquire('robot-7', 'client-a', 1);
    await new Promise((resolve) => setTimeout(resolve, 5));

    const clientB = service.acquire('robot-7', 'client-b', 60_000);
    expect(clientB.holder).toBe('client-b');
  });

  it('fails verification for a lease whose signature has been tampered with', () => {
    const service = new LeaseService();
    const lease = service.acquire('robot-7', 'client-a', 60_000);
    const tampered = { ...lease, holder: 'client-b' };

    expect(service.verify(tampered)).toBe(false);
  });
});
