import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { prisma } from '@repo/database';
import { generateCsrfToken } from './csrf.util.js';
import type { LoginDto, RegisterDto } from './dto.js';
import type { JwtPayload } from './jwt-payload.js';

const SALT_ROUNDS = 12;

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
