import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_COOKIE_NAME } from './auth-cookie.js';
import type { JwtPayload } from './jwt-payload.js';

/** Web clients authenticate via the httpOnly cookie; field-tablet (React
 *  Native, no browser cookie jar) still sends a Bearer header. Cookie is
 *  tried first since it's the common case now. */
function fromCookieOrHeader(req: FastifyRequest): string | null {
  return req.cookies?.[AUTH_COOKIE_NAME] ?? ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }
    super({
      jwtFromRequest: fromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /** Whatever this returns becomes `request.user`. */
  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
