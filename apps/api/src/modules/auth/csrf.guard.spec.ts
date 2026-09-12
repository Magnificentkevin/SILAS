import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { CsrfGuard } from './csrf.guard.js';
import { CSRF_HEADER_NAME } from './csrf.util.js';
import { SKIP_CSRF_KEY } from './skip-csrf.decorator.js';
import type { JwtPayload } from './jwt-payload.js';

function fakeJwtService(payload: JwtPayload | Error) {
  return {
    verify: vi.fn(() => {
      if (payload instanceof Error) throw payload;
      return payload;
    }),
  };
}

function contextFor(options: {
  method?: string;
  authorization?: string;
  authCookie?: string;
  headerToken?: string;
  skipCsrf?: boolean;
}): ExecutionContext {
  const reflector = new Reflector();
  const handler = () => undefined;
  Reflect.defineMetadata(SKIP_CSRF_KEY, options.skipCsrf, handler);

  const request = {
    method: options.method ?? 'POST',
    headers: {
      ...(options.authorization ? { authorization: options.authorization } : {}),
      ...(options.headerToken !== undefined ? { [CSRF_HEADER_NAME]: options.headerToken } : {}),
    },
    cookies: options.authCookie !== undefined ? { silas_at: options.authCookie } : {},
  };

  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function payloadWith(csrfToken: string): JwtPayload {
  return { sub: 'user-1', email: 'user@example.com', globalRole: null, memberships: [], csrfToken };
}

describe('CsrfGuard', () => {
  it('allows a route marked @SkipCsrf() through with no checks at all', () => {
    const guard = new CsrfGuard(fakeJwtService(new Error('should not be called')) as never, new Reflector());
    const context = contextFor({ skipCsrf: true });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a bearer-token request through with no CSRF check', () => {
    const guard = new CsrfGuard(fakeJwtService(new Error('should not be called')) as never, new Reflector());
    const context = contextFor({ authorization: 'Bearer some.jwt.token' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a non-mutating method through with no session cookie', () => {
    const guard = new CsrfGuard(fakeJwtService(new Error('should not be called')) as never, new Reflector());
    const context = contextFor({ method: 'GET' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a mutating request with no session cookie at all -- lets the real auth guard reject it', () => {
    const guard = new CsrfGuard(fakeJwtService(new Error('should not be called')) as never, new Reflector());
    const context = contextFor({});
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a mutating request with an invalid/expired session cookie -- lets the real auth guard reject it', () => {
    const guard = new CsrfGuard(fakeJwtService(new Error('invalid signature')) as never, new Reflector());
    const context = contextFor({ authCookie: 'garbage', headerToken: 'anything' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a mutating request when the header token matches the session JWT csrfToken claim', () => {
    const guard = new CsrfGuard(fakeJwtService(payloadWith('a'.repeat(64))) as never, new Reflector());
    const context = contextFor({ authCookie: 'valid.jwt', headerToken: 'a'.repeat(64) });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies when the header token is missing', () => {
    const guard = new CsrfGuard(fakeJwtService(payloadWith('a'.repeat(64))) as never, new Reflector());
    const context = contextFor({ authCookie: 'valid.jwt' });
    expect(() => guard.canActivate(context)).toThrow('Invalid CSRF token');
  });

  it('denies when the header token does not match the claim', () => {
    const guard = new CsrfGuard(fakeJwtService(payloadWith('a'.repeat(64))) as never, new Reflector());
    const context = contextFor({ authCookie: 'valid.jwt', headerToken: 'b'.repeat(64) });
    expect(() => guard.canActivate(context)).toThrow('Invalid CSRF token');
  });

  it('denies when the tokens differ only in length, without throwing on the length mismatch itself', () => {
    const guard = new CsrfGuard(fakeJwtService(payloadWith('a'.repeat(64))) as never, new Reflector());
    const context = contextFor({ authCookie: 'valid.jwt', headerToken: 'a'.repeat(63) });
    expect(() => guard.canActivate(context)).toThrow('Invalid CSRF token');
  });

  // The bug every independent review of this codebase found: the guard's
  // logic was correct in isolation, but nothing verified it was actually
  // applied to the one route that can never carry a pre-existing session
  // token -- login/register. This asserts the real wiring, not just the
  // guard's internal behavior.
  it('the real AuthController.login and .register are marked @SkipCsrf()', () => {
    const reflector = new Reflector();
    expect(reflector.get(SKIP_CSRF_KEY, AuthController.prototype.login)).toBe(true);
    expect(reflector.get(SKIP_CSRF_KEY, AuthController.prototype.register)).toBe(true);
  });
});
