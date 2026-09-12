import { describe, expect, it } from 'vitest';
import { AuditVault } from './audit-vault.js';

describe('AuditVault', () => {
  it('links each sealed event to the hash of the one before it', () => {
    const vault = new AuditVault();
    const first = vault.append('lease.acquired', { resourceId: 'robot-7' });
    const second = vault.append('saga.committed', { resourceId: 'robot-7' });

    expect(second.prevHash).toBe(first.hash);
    expect(second.index).toBe(1);
  });

  it('passes independent verification for an untampered chain', () => {
    const vault = new AuditVault();
    vault.append('lease.acquired', { resourceId: 'robot-7' });
    vault.append('saga.committed', { resourceId: 'robot-7' });

    expect(vault.verify()).toEqual({ ok: true });
  });

  it('detects tampering at the exact index where a sealed event was altered', () => {
    const vault = new AuditVault();
    vault.append('lease.acquired', { resourceId: 'robot-7' });
    vault.append('saga.committed', { resourceId: 'robot-7' });
    vault.append('audit.closed', { resourceId: 'robot-7' });

    const chain = vault.getChain() as { payload: unknown }[];
    chain[1]!.payload = { resourceId: 'robot-7-forged' };

    expect(vault.verify()).toEqual({ ok: false, brokenAtIndex: 1 });
  });
});
