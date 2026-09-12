import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard.js';
import type { JwtPayload } from './jwt-payload.js';
import type { Role } from '@repo/database';

function contextFor(options: {
  requiredRoles?: Role[];
  user?: JwtPayload;
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}): ExecutionContext {
  const reflector = new Reflector();
  const handler = () => undefined;
  Reflect.defineMetadata('roles', options.requiredRoles, handler);

  const request = { user: options.user, params: options.params ?? {}, body: options.body ?? {} };

  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

const ACCOUNT_A = 'account-a';
const ACCOUNT_B = 'account-b';

function userWith(overrides: Partial<JwtPayload>): JwtPayload {
  return {
    sub: 'user-1',
    email: 'user@example.com',
    globalRole: null,
    memberships: [],
    csrfToken: 'test-csrf-token',
    ...overrides,
  };
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows any request through when the route declares no required roles', () => {
    const context = contextFor({ requiredRoles: undefined, user: userWith({}) });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies when there is no authenticated user at all', () => {
    const context = contextFor({ requiredRoles: ['ADMIN'], user: undefined });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('lets ADMIN through regardless of what the route requires', () => {
    const context = contextFor({
      requiredRoles: ['VENDOR'],
      user: userWith({ globalRole: 'ADMIN' }),
      params: { accountId: ACCOUNT_A },
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('matches an internal role (OPERATOR) directly, with no account involved', () => {
    const context = contextFor({
      requiredRoles: ['OPERATOR'],
      user: userWith({ globalRole: 'OPERATOR' }),
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies an internal role that is not the one the route requires', () => {
    const context = contextFor({
      requiredRoles: ['VERIFIER'],
      user: userWith({ globalRole: 'OPERATOR' }),
    });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows a VENDOR membership on the exact account the request concerns', () => {
    const context = contextFor({
      requiredRoles: ['VENDOR'],
      user: userWith({ memberships: [{ accountId: ACCOUNT_A, role: 'VENDOR' }] }),
      params: { accountId: ACCOUNT_A },
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('the core tenant-isolation case: denies a VENDOR membership on a DIFFERENT account', () => {
    const context = contextFor({
      requiredRoles: ['VENDOR'],
      user: userWith({ memberships: [{ accountId: ACCOUNT_A, role: 'VENDOR' }] }),
      params: { accountId: ACCOUNT_B },
    });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies an external-role requirement when the request has no accountId at all', () => {
    const context = contextFor({
      requiredRoles: ['CUSTOMER'],
      user: userWith({ memberships: [{ accountId: ACCOUNT_A, role: 'CUSTOMER' }] }),
    });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('reads accountId from the request body when it is not a route param', () => {
    const context = contextFor({
      requiredRoles: ['HOST_CLIENT'],
      user: userWith({ memberships: [{ accountId: ACCOUNT_A, role: 'HOST_CLIENT' }] }),
      body: { accountId: ACCOUNT_A },
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies when the membership is for the right account but the wrong role', () => {
    const context = contextFor({
      requiredRoles: ['VENDOR'],
      user: userWith({ memberships: [{ accountId: ACCOUNT_A, role: 'CUSTOMER' }] }),
      params: { accountId: ACCOUNT_A },
    });
    expect(guard.canActivate(context)).toBe(false);
  });
});
