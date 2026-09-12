import { describe, expect, it } from 'vitest';
import { SagaEngine } from './saga-engine.js';
import type { SagaStepDefinition } from '../runtime/types.js';

interface Ctx {
  log: string[];
}

function step(name: string, opts: { failForward?: boolean; failInverse?: boolean } = {}): SagaStepDefinition<Ctx> {
  return {
    name,
    forward: async (ctx) => {
      if (opts.failForward) throw new Error(`${name} forward failed`);
      return { log: [...ctx.log, `${name}:forward`] };
    },
    inverse: async (ctx) => {
      if (opts.failInverse) throw new Error(`${name} inverse failed`);
      return { log: [...ctx.log, `${name}:inverse`] };
    },
  };
}

describe('SagaEngine golden path', () => {
  it('commits once every step succeeds, in order', async () => {
    const engine = new SagaEngine<Ctx>([step('acquire'), step('dispatch'), step('settle')]);
    const result = await engine.run({ log: [] });

    expect(result.status).toBe('COMMITTED');
    expect(result.context.log).toEqual(['acquire:forward', 'dispatch:forward', 'settle:forward']);
  });
});

describe('SagaEngine failure path', () => {
  it('runs inverse mutations in reverse order and reaches RECOVERED when a downstream step fails', async () => {
    const engine = new SagaEngine<Ctx>([step('acquire'), step('dispatch'), step('settle', { failForward: true })]);
    const result = await engine.run({ log: [] });

    expect(result.status).toBe('RECOVERED');
    expect(result.failureReason).toBe('settle forward failed');
    expect(result.context.log).toEqual(['acquire:forward', 'dispatch:forward', 'dispatch:inverse', 'acquire:inverse']);
  });

  it('reaches BREACH_RECOVERY when a compensating inverse mutation itself fails', async () => {
    const engine = new SagaEngine<Ctx>([
      step('acquire', { failInverse: true }),
      step('dispatch'),
      step('settle', { failForward: true }),
    ]);
    const result = await engine.run({ log: [] });

    expect(result.status).toBe('BREACH_RECOVERY');
  });

  it('leaves an unambiguous step-by-step trace suitable for audit sealing', async () => {
    const engine = new SagaEngine<Ctx>([step('acquire'), step('settle', { failForward: true })]);
    const result = await engine.run({ log: [] });

    expect(result.steps.map((s) => `${s.name}:${s.outcome}`)).toEqual([
      'acquire:FORWARD_OK',
      'settle:FORWARD_FAILED',
      'acquire:INVERSE_OK',
    ]);
  });
});
