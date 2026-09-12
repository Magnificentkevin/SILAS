import { describe, expect, it } from 'vitest';
import { CredentialCipher, CredentialCipherIntegrityError, CredentialCipherKeyError } from './credential-cipher.js';

describe('CredentialCipher', () => {
  it('round-trips a plaintext credential through seal and open', () => {
    const cipher = new CredentialCipher(CredentialCipher.generateKey());
    const sealed = cipher.seal('sk_live_abc123');

    expect(sealed).not.toContain('sk_live_abc123');
    expect(cipher.open(sealed)).toBe('sk_live_abc123');
  });

  it('produces a different ciphertext on every call, even for the same plaintext', () => {
    const cipher = new CredentialCipher(CredentialCipher.generateKey());
    const first = cipher.seal('sk_live_abc123');
    const second = cipher.seal('sk_live_abc123');

    expect(first).not.toBe(second);
  });

  it('rejects a key that is not 32 bytes once hex-decoded', () => {
    const shortKey = Buffer.from('too-short').toString('hex');
    expect(() => new CredentialCipher(shortKey)).toThrow(CredentialCipherKeyError);
  });

  it('fails closed when the sealed value has been tampered with', () => {
    const cipher = new CredentialCipher(CredentialCipher.generateKey());
    const sealed = cipher.seal('sk_live_abc123');

    const [iv, authTag, ciphertext] = sealed.split(':');
    const tamperedCiphertext = ciphertext!.slice(0, -2) + (ciphertext!.slice(-2) === '00' ? '01' : '00');
    const tampered = [iv, authTag, tamperedCiphertext].join(':');

    expect(() => cipher.open(tampered)).toThrow(CredentialCipherIntegrityError);
  });

  it('fails closed when the sealed value is malformed', () => {
    const cipher = new CredentialCipher(CredentialCipher.generateKey());
    expect(() => cipher.open('not-a-valid-sealed-value')).toThrow(CredentialCipherIntegrityError);
  });

  it('fails closed when opened with the wrong key', () => {
    const sealed = new CredentialCipher(CredentialCipher.generateKey()).seal('sk_live_abc123');
    const wrongCipher = new CredentialCipher(CredentialCipher.generateKey());

    expect(() => wrongCipher.open(sealed)).toThrow(CredentialCipherIntegrityError);
  });
});
