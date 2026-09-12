import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { AUTH_COOKIE_NAME } from './auth-cookie.js';
import { CSRF_HEADER_NAME } from './csrf.util.js';
import type { JwtPayload } from './jwt-payload.js';
import { SKIP_CSRF_KEY } from './skip-csrf.decorator.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Cross-site cookies (required because client-portal and the API live on
 * different domains) mean the browser auto-attaches the auth cookie to
 * requests a malicious page could also trigger — the classic CSRF gap that
 * a Bearer-token-in-header scheme doesn't have (a third-party page can't
 * set an Authorization header on a cross-site request it triggers).
 *
 * Mitigation: a CSRF token minted once at login/register and embedded as a
 * claim in the session JWT itself (see jwt-payload.ts), delivered to the
 * client in that response's JSON body -- never a second cookie. A
 * cross-site attacker can trigger a request that carries the auth cookie,
 * but can't read the login response body (CORS blocks that), so it can
 * never learn the token to echo back as a header. This guard verifies the
 * JWT itself (rather than trusting request.user) since it runs globally,
 * before any per-route JwtAuthGuard would have populated that.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const skipCsrf = this.reflector.getAllAndOverride<boolean | undefined>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipCsrf) {
      return true;
    }

    const req = context.switchToHttp().getRequest<FastifyRequest>();

    // Bearer-token clients (field-tablet) aren't cookie-authenticated, so
    // they carry none of the cross-site auto-attach risk this guards against.
    if (req.headers.authorization) {
      return true;
    }

    if (!MUTATING_METHODS.has(req.method)) {
      return true;
    }

    const authToken = req.cookies?.[AUTH_COOKIE_NAME];
    // No session cookie at all -- this request isn't authenticated, so it's
    // not carrying ambient credentials a forged request could ride on
    // either. Let JwtAuthGuard (wherever the route applies it) reject it
    // with the correct "unauthenticated" semantics rather than this guard
    // producing a misleading CSRF-specific error.
    if (!authToken) {
      return true;
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(authToken);
    } catch {
      // Invalid/expired session -- same reasoning as above, let the route's
      // own auth guard produce the real error.
      return true;
    }

    const headerToken = req.headers[CSRF_HEADER_NAME];
    if (typeof headerToken !== 'string' || !tokensMatch(payload.csrfToken, headerToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}

// timingSafeEqual over === -- an attacker who can fire many requests and
// measure response latency could otherwise recover the token byte by byte
// via a short-circuiting string compare. Length is checked first since
// timingSafeEqual throws on a length mismatch rather than returning false;
// leaking "the length didn't match" isn't useful here since the token
// length is fixed and public (generateCsrfToken's output size), not a
// secret in itself.
function tokensMatch(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}
