import type { PreFlightCheckDefinition, PreFlightFailure, PreFlightResult } from '../runtime/types.js';

/**
 * Deterministic relational/data-health validation before an operation is
 * allowed to execute — confirms required records and consistency, distinct
 * from sanitization's data-privacy concern. Mechanism family F from the
 * Patent Core Audit.
 */
export class PreFlightEngine<TContext> {
  constructor(private readonly warningThreshold: number = 0) {}

  run(checks: readonly PreFlightCheckDefinition<TContext>[], context: TContext): PreFlightResult {
    const failures: PreFlightFailure[] = [];

    for (const check of checks) {
      if (!check.validate(context)) {
        failures.push({ name: check.name, severity: check.severity });
      }
    }

    const hasBlockingFailure = failures.some((failure) => failure.severity === 'BLOCKING');
    const warningCount = failures.filter((failure) => failure.severity === 'WARNING').length;

    // A BLOCKING failure always fails the check. Otherwise, the threshold
    // is a maximum tolerated count: reaching it still passes, only
    // exceeding it fails.
    const passed = !hasBlockingFailure && warningCount <= this.warningThreshold;

    return { passed, failures };
  }
}
