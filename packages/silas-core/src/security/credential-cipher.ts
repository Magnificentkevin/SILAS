import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32;

export class CredentialCipherKeyError extends Error {
  constructor() {
    super('CredentialCipher requires a 32-byte key, hex-encoded (64 hex characters)');
    this.name = 'CredentialCipherKeyError';
  }
}

export class CredentialCipherIntegrityError extends Error {
  constructor() {
    super('Sealed credential failed authentication — it was tampered with or the key is wrong');
    this.name = 'CredentialCipherIntegrityError';
  }
}

/**
 * Seals third-party credentials (API keys, OAuth tokens) at rest with
 * AES-256-GCM, in the same `iv:authTag:ciphertext` hex format already used
 * by the scheduling module's access-pin encryption. The sealed form is
 * authenticated: tampering, or the wrong key, fails closed.
 */
export class CredentialCipher {
  private readonly key: Buffer;

  constructor(hexKey: string) {
    const key = Buffer.from(hexKey, 'hex');
    if (key.length !== KEY_LENGTH_BYTES) {
      throw new CredentialCipherKeyError();
    }
    this.key = key;
  }

  seal(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join(':');
  }

  open(sealed: string): string {
    const [ivHex, authTagHex, ciphertextHex] = sealed.split(':');
    if (!ivHex || !authTagHex || !ciphertextHex) {
      throw new CredentialCipherIntegrityError();
    }

    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    try {
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertextHex, 'hex')),
        decipher.final(),
      ]);
      return plaintext.toString('utf8');
    } catch {
      throw new CredentialCipherIntegrityError();
    }
  }

  static generateKey(): string {
    return randomBytes(KEY_LENGTH_BYTES).toString('hex');
  }
}
