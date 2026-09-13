import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@repo/database';
import { sendPasswordResetEmail } from '@repo/email';
import { generateCsrfToken } from './csrf.util.js';
import type { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordApp } from './dto.js';
import type { JwtPayload } from './jwt-payload.js';

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(`An account with email ${dto.email} already exists`);
    }

    const passwordHash = await hash(dto.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
      },
      include: { memberships: true },
    });

    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      include: { memberships: true },
    });
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueToken(user);
  }

  /**
   * Always resolves the same way whether or not the email belongs to a real
   * account -- the response can't be used to enumerate registered emails.
   * A send failure (bad Resend key, provider outage) is logged, not thrown,
   * for the same reason: surfacing it to the caller would itself leak
   * whether the account exists.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ ok: true }> {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    if (user) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const resetUrl = `${this.resetPasswordBaseUrl(dto.app)}?token=${rawToken}`;

      try {
        await sendPasswordResetEmail({
          from: process.env.PASSWORD_RESET_EMAIL_FROM ?? 'SILAS <no-reply@silaserv.com>',
          to: user.email,
          props: {
            name: user.name,
            resetUrl,
            expiresInMinutes: RESET_TOKEN_TTL_MS / 60_000,
          },
        });
      } catch (err) {
        console.error('Failed to send password reset email', err);
      }
    }

    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ ok: true }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }

    const passwordHash = await hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ]);

    return { ok: true };
  }

  /** Never trust a client-supplied return URL for this -- that would let a
   *  phishing page get a legitimate reset link pointed at itself just by
   *  asking. Each app maps to a base URL the server itself controls. */
  private resetPasswordBaseUrl(app: ResetPasswordApp): string {
    const envVar = { 'client-portal': 'CLIENT_PORTAL_URL', 'staff-console': 'STAFF_CONSOLE_URL', 'web-client': 'WEB_CLIENT_URL' }[app];
    const base = process.env[envVar];
    if (!base) {
      throw new InternalServerErrorException(`${envVar} is not set`);
    }
    return `${base.replace(/\/$/, '')}/reset-password`;
  }

  private issueToken(user: {
    id: string;
    email: string;
    globalRole: string | null;
    memberships: { accountId: string; role: string }[];
  }) {
    const csrfToken = generateCsrfToken();
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      globalRole: user.globalRole as JwtPayload['globalRole'],
      memberships: user.memberships.map((m) => ({
        accountId: m.accountId,
        role: m.role as JwtPayload['memberships'][number]['role'],
      })),
      csrfToken,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      csrfToken,
      user: { id: user.id, email: user.email, globalRole: user.globalRole },
    };
  }
}
