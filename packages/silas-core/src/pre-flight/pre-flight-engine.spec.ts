import { describe, expect, it } from 'vitest';
import { PreFlightEngine } from './pre-flight-engine.js';
import type { PreFlightCheckDefinition } from '../runtime/types.js';

interface Ctx {
  hasAccount: boolean;
  hasPricing: boolean;
  hasStaleNote: boolean;
}

function check(
  name: string,
  severity: 'BLOCKING' | 'WARNING',
  validate: (ctx: Ctx) => boolean,
): PreFlightCheckDefinition<Ctx> {
  return { name, severity, validate };
}

describe('PreFlightEngine', () => {
  describe('collecting failures', () => {
    it('collects a failure for every check that does not validate, regardless of severity', () => {
      const engine = new PreFlightEngine<Ctx>();
      const checks = [
        check('has-account', 'BLOCKING', (ctx) => ctx.hasAccount),
        check('has-pricing', 'WARNING', (ctx) => ctx.hasPricing),
      ];

      const result = engine.run(checks, { hasAccount: false, hasPricing: false, hasStaleNote: false });

      expect(result.failures).toEqual([
        { name: 'has-account', severity: 'BLOCKING' },
        { name: 'has-pricing', severity: 'WARNING' },
      ]);
    });

    it('collects no failures when every check validates', () => {
      const engine = new PreFlightEngine<Ctx>();
      const checks = [check('has-account', 'BLOCKING', (ctx) => ctx.hasAccount)];

      const result = engine.run(checks, { hasAccount: true, hasPricing: true, hasStaleNote: false });

      expect(result.failures).toEqual([]);
    });
  });

  describe('pass/fail threshold', () => {
    it('passes when there are no failures at all', () => {
      const engine = new PreFlightEngine<Ctx>(2);
      const checks = [check('has-account', 'BLOCKING', (ctx) => ctx.hasAccount)];

      const result = engine.run(checks, { hasAccount: true, hasPricing: true, hasStaleNote: false });
      expect(result.passed).toBe(true);
    });

    it('fails when there is a BLOCKING failure, even with a generous warning threshold', () => {
      const engine = new PreFlightEngine<Ctx>(10);
      const checks = [check('has-account', 'BLOCKING', (ctx) => ctx.hasAccount)];

      const result = engine.run(checks, { hasAccount: false, hasPricing: true, hasStaleNote: false });
      expect(result.passed).toBe(false);
    });

    it('passes when WARNING failures are clearly under the threshold', () => {
      const engine = new PreFlightEngine<Ctx>(3);
      const checks = [check('has-pricing', 'WARNING', (ctx) => ctx.hasPricing)];

      const result = engine.run(checks, { hasAccount: true, hasPricing: false, hasStaleNote: false });
      expect(result.passed).toBe(true);
    });

    it('fails when WARNING failures clearly exceed the threshold', () => {
      const engine = new PreFlightEngine<Ctx>(1);
      const checks = [
        check('has-pricing', 'WARNING', (ctx) => ctx.hasPricing),
        check('no-stale-note', 'WARNING', (ctx) => !ctx.hasStaleNote),
        check('has-account-nickname', 'WARNING', () => false),
      ];

      const result = engine.run(checks, { hasAccount: true, hasPricing: false, hasStaleNote: true });
      expect(result.passed).toBe(false);
    });
  });
});
