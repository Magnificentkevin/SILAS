import { randomBytes } from 'node:crypto';

export const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}
