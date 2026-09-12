import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@repo/database';
import type { FastifyRequest } from 'fastify';
import { ROLES_KEY } from './roles.decorator.js';
import type { JwtPayload } from './jwt-payload.js';

interface RequestBody {
  accountId?: string;
}

/**
 * Runs after JwtAuthGuard, which has already put the decoded token on
 * request.user. This guard decides whether that user's role(s) actually
 * satisfy what the route requires — the one place in the whole auth stack
 * where "is this vendor allowed to touch this account's data" gets decided.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Route didn't opt into role checks at all — nothing to enforce here.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<
        FastifyRequest<{ Params: Record<string, string>; Body: RequestBody }> & {
          user?: JwtPayload;
        }
      >();
    const user = request.user;

    // JwtAuthGuard should already reject an unauthenticated request before
    // this guard ever runs — but fail closed rather than assume that held.
    if (!user) {
      return false;
    }

    // The account this specific request concerns, if it concerns one at all —
    // e.g. a scan sync, a lock commit, or an integration action for a facility.
    const accountId: string | undefined =
      request.params?.accountId ?? request.body?.accountId ?? undefined;

    // ADMIN is the one role that isn't scoped to a route list or an account —
    // it's the founder/full-control role, so it always passes.
    if (user.globalRole === 'ADMIN') {
      return true;
    }

    // Internal staff roles (OPERATOR/VERIFIER) aren't tied to one account —
    // if the route explicitly allows this exact role, that's a direct match.
    if (user.globalRole && requiredRoles.includes(user.globalRole)) {
      return true;
    }

    // Everything left in requiredRoles is an external, account-scoped role
    // (VENDOR/CUSTOMER/HOST_CLIENT). Without knowing which account this
    // request concerns, there's no safe way to say yes — fail closed.
    if (!accountId) {
      return false;
    }

    // The actual tenant-isolation check: this user must hold one of the
    // required roles on THIS SPECIFIC account, not just anywhere. Holding
    // VENDOR on account A must never grant access to account B.
    return user.memberships.some(
      (membership) => membership.accountId === accountId && requiredRoles.includes(membership.role),
    );
  }
}
