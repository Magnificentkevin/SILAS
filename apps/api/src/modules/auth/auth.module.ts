import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { SignOptions } from 'jsonwebtoken';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { CsrfGuard } from './csrf.guard.js';
import { JwtStrategy } from './jwt.strategy.js';
import { RolesGuard } from './roles.guard.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as SignOptions['expiresIn'] },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    // Global, but registered here (not app.useGlobalGuards in main.ts) so it
    // goes through Nest's DI and can receive JwtService/Reflector -- it needs
    // to verify the session JWT itself, since it runs before any per-route
    // JwtAuthGuard would have populated request.user.
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
  exports: [PassportModule, JwtModule, RolesGuard],
})
export class AuthModule {}
