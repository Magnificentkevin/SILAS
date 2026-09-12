import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from './jwt-payload.js';
import type { FastifyRequest } from 'fastify';

/** Pulls the decoded JWT (set by JwtAuthGuard) off the request. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): JwtPayload => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest & { user: JwtPayload }>();
  return request.user;
});
