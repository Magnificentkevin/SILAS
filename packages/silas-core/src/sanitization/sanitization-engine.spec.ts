import { describe, expect, it } from 'vitest';
import { SanitizationEngine } from './sanitization-engine.js';

describe('SanitizationEngine', () => {
  describe('tokenize', () => {
    it('produces the same token for the same raw value', () => {
      const engine = new SanitizationEngine();
      expect(engine.tokenize('jane@example.com')).toBe(engine.tokenize('jane@example.com'));
    });

    it('produces different tokens for different raw values', () => {
      const engine = new SanitizationEngine();
      expect(engine.tokenize('jane@example.com')).not.toBe(engine.tokenize('john@example.com'));
    });

    it('never returns the raw value itself', () => {
      const engine = new SanitizationEngine();
      expect(engine.tokenize('jane@example.com')).not.toBe('jane@example.com');
    });
  });

  describe('sanitize', () => {
    it('tokenizes only the fields named in the rules, leaving everything else untouched', () => {
      const engine = new SanitizationEngine();
      const payload = { name: 'Jane Doe', email: 'jane@example.com', notes: 'left gate code with tenant' };

      const result = engine.sanitize(payload, [{ field: 'email', strategy: 'TOKENIZE' }]);

      expect(result.email).toBe(engine.tokenize('jane@example.com'));
      expect(result.name).toBe('Jane Doe');
      expect(result.notes).toBe('left gate code with tenant');
    });

    it('does not mutate the original payload', () => {
      const engine = new SanitizationEngine();
      const payload = { email: 'jane@example.com' };

      const result = engine.sanitize(payload, [{ field: 'email', strategy: 'TOKENIZE' }]);

      expect(payload.email).toBe('jane@example.com');
      expect(result).not.toBe(payload);
    });

    it('skips a rule for a field that is not present on the payload', () => {
      const engine = new SanitizationEngine();
      const payload = { name: 'Jane Doe' } as { name: string; email?: string };

      const result = engine.sanitize(payload, [{ field: 'email', strategy: 'TOKENIZE' }]);
      expect(result).toEqual({ name: 'Jane Doe' });
    });

    describe('REDACT strategy', () => {
      it('replaces a payment field with something other than the raw value', () => {
        const engine = new SanitizationEngine();
        const payload = { cardNumber: '4242424242424242' };

        const result = engine.sanitize(payload, [{ field: 'cardNumber', strategy: 'REDACT' }]);
        expect(result.cardNumber).not.toBe('4242424242424242');
      });

      it('never leaks the full raw value as a substring of the redacted output', () => {
        const engine = new SanitizationEngine();
        const rawCard = '4242424242424242';

        const redacted = engine.redact(rawCard, 'cardNumber');
        expect(redacted.includes(rawCard)).toBe(false);
      });
    });
  });
});
