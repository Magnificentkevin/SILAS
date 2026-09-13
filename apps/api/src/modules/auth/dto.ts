import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  name!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export const RESET_PASSWORD_APPS = ['client-portal', 'staff-console', 'web-client'] as const;
export type ResetPasswordApp = (typeof RESET_PASSWORD_APPS)[number];

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;

  /** Which frontend to build the reset link for -- a fixed identifier the
   *  server maps to its own configured base URL, never a client-supplied
   *  URL (that would let a phishing page harvest a legitimate reset token
   *  just by asking for its own domain to be used in the email). */
  @IsIn(RESET_PASSWORD_APPS)
  app!: ResetPasswordApp;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
