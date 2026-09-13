import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME } from './auth-cookie.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { JwtPayload } from './jwt-payload.js';
import { SkipCsrf } from './skip-csrf.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Exempt from CsrfGuard: this is the pre-session bootstrap endpoint that
  // *creates* the session the CSRF token is bound to -- there's no session
  // yet for a token to be scoped to when this request is made.
  @SkipCsrf()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) reply: FastifyReply) {
    const result = await this.authService.register(dto);
    this.setAuthCookie(reply, result.accessToken);
    return result;
  }

  @SkipCsrf()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) reply: FastifyReply) {
    const result = await this.authService.login(dto);
    this.setAuthCookie(reply, result.accessToken);
    return result;
  }

  // Exempt from CsrfGuard, same reasoning as login/register: nobody has a
  // session (or a CSRF token bound to one) at the point they're asking for
  // a reset link or submitting a new password with one.
  @SkipCsrf()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @SkipCsrf()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return { ok: true };
  }

  /** Proves the token round-trips correctly — no role check, just "is this a valid bearer token." */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return user;
  }

  private setAuthCookie(reply: FastifyReply, accessToken: string): void {
    reply.setCookie(AUTH_COOKIE_NAME, accessToken, {
      path: '/',
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });
  }
}
