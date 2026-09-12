import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Requires a valid bearer token. Attaches the decoded JwtPayload as request.user. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
