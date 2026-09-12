import { createCipheriv, createDecipheriv, randomBytes, randomInt } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;

function getEncryptionKey(): Buffer {
  const keyHex = process.env.SCHEDULE_LOCK_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('SCHEDULE_LOCK_ENCRYPTION_KEY is not set');
  }

  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('SCHEDULE_LOCK_ENCRYPTION_KEY must be 32 bytes (64 hex characters) for AES-256');
  }

  return key;
}

/** Generates a cryptographically secure 6-digit numeric access PIN. */
export function generateAccessPin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** Encrypts a PIN with AES-256-GCM, returning `iv:authTag:ciphertext` as hex. */
export function encryptAccessPin(pin: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(pin, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

/** Reverses encryptAccessPin. Throws if the payload was tampered with or the key is wrong. */
export function decryptAccessPin(payload: string): string {
  const [ivHex, authTagHex, dataHex] = payload.split(':');
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error('Malformed encrypted access PIN payload');
  }

  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
