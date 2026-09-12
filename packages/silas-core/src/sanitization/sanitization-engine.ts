import { createHmac } from 'node:crypto';
import type { SanitizationRule } from '../runtime/types.js';

/**
 * Deterministic transformation of sensitive fields before a payload leaves
 * the client — client-side data minimization plus payment isolation.
 * Mechanism family B from the Patent Core Audit.
 */
export class SanitizationEngine {
  constructor(private readonly secret: string = 'silas-dev-secret') {}

  /** Applies each rule's strategy to the matching field. Returns a new object — payload is never mutated. */
  sanitize<T extends Record<string, unknown>>(payload: T, rules: readonly SanitizationRule[]): T {
    const result: Record<string, unknown> = { ...payload };

    for (const rule of rules) {
      if (!(rule.field in result)) continue;
      const raw = result[rule.field];
      if (raw === undefined || raw === null) continue;

      result[rule.field] = rule.strategy === 'TOKENIZE' ? this.tokenize(String(raw)) : this.redact(String(raw), rule.field);
    }

    return result as T;
  }

  /** Deterministic one-way token: the same raw value always produces the same token, without exposing it. */
  tokenize(rawValue: string): string {
    return createHmac('sha256', this.secret).update(rawValue).digest('hex');
  }

  /**
   * Masks a payment/sensitive value to its last 4 characters — the
   * industry-standard middle ground (e.g. "card ending in 4242") that still
   * never exposes the full raw value. Values of 4 characters or fewer are
   * masked entirely, since revealing all of a short value would defeat the
   * purpose.
   */
  redact(rawValue: string, field: string): string {
    if (rawValue.length <= 4) {
      return '*'.repeat(rawValue.length);
    }
    const last4 = rawValue.slice(-4);
    return '*'.repeat(rawValue.length - 4) + last4;
  }
}
