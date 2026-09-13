import { beforeEach, describe, expect, it, vi } from 'vitest';

const userFindUniqueMock = vi.fn();
const userUpdateMock = vi.fn();
const tokenCreateMock = vi.fn();
const tokenFindUniqueMock = vi.fn();
const tokenUpdateMock = vi.fn();
const transactionMock = vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops));
const sendPasswordResetEmailMock = vi.fn();

vi.mock('@repo/database', () => ({
  prisma: {
    user: { findUnique: userFindUniqueMock, update: userUpdateMock },
    passwordResetToken: {
      create: tokenCreateMock,
      findUnique: tokenFindUniqueMock,
      update: tokenUpdateMock,
    },
    $transaction: transactionMock,
  },
}));

vi.mock('@repo/email', () => ({
  sendPasswordResetEmail: sendPasswordResetEmailMock,
}));

const { AuthService } = await import('./auth.service.js');

const fakeJwtService = { sign: vi.fn(() => 'signed.jwt.token') };

function freshToken(overrides: Partial<{ usedAt: Date | null; expiresAt: Date }> = {}) {
  return {
    id: 'reset-token-1',
    userId: 'user-1',
    tokenHash: 'irrelevant-in-these-assertions',
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('AuthService.forgotPassword', () => {
  let service: InstanceType<typeof AuthService>;

  beforeEach(() => {
    userFindUniqueMock.mockReset();
    tokenCreateMock.mockReset();
    sendPasswordResetEmailMock.mockReset();
    process.env.CLIENT_PORTAL_URL = 'https://client-portal.example.invalid';
    service = new AuthService(fakeJwtService as never);
  });

  it('creates a token and sends the email when the account exists', async () => {
    userFindUniqueMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com', name: 'A' });
    tokenCreateMock.mockResolvedValue(freshToken());
    sendPasswordResetEmailMock.mockResolvedValue({});

    await expect(service.forgotPassword({ email: 'a@example.com', app: 'client-portal' })).resolves.toEqual({
      ok: true,
    });

    expect(tokenCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) }),
    );
    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@example.com',
        props: expect.objectContaining({
          resetUrl: expect.stringContaining('https://client-portal.example.invalid/reset-password?token='),
        }),
      }),
    );
  });

  it('returns the same response and sends nothing when no account matches -- prevents email enumeration', async () => {
    userFindUniqueMock.mockResolvedValue(null);

    await expect(service.forgotPassword({ email: 'nobody@example.com', app: 'client-portal' })).resolves.toEqual({
      ok: true,
    });

    expect(tokenCreateMock).not.toHaveBeenCalled();
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });

  it('still returns ok even when the email provider throws -- the failure must not leak account existence', async () => {
    userFindUniqueMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com', name: 'A' });
    tokenCreateMock.mockResolvedValue(freshToken());
    sendPasswordResetEmailMock.mockRejectedValue(new Error('Resend is down'));

    await expect(service.forgotPassword({ email: 'a@example.com', app: 'client-portal' })).resolves.toEqual({
      ok: true,
    });
  });

  it('throws when the target app has no configured base URL', async () => {
    userFindUniqueMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com', name: 'A' });
    delete process.env.STAFF_CONSOLE_URL;

    await expect(service.forgotPassword({ email: 'a@example.com', app: 'staff-console' })).rejects.toThrow(
      'STAFF_CONSOLE_URL is not set',
    );
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });
});

describe('AuthService.resetPassword', () => {
  let service: InstanceType<typeof AuthService>;

  beforeEach(() => {
    tokenFindUniqueMock.mockReset();
    tokenUpdateMock.mockReset();
    userUpdateMock.mockReset();
    transactionMock.mockClear();
    service = new AuthService(fakeJwtService as never);
  });

  it('accepts a valid token, updates the password, and marks the token used', async () => {
    tokenFindUniqueMock.mockResolvedValue(freshToken());

    await expect(service.resetPassword('raw-token', 'a-new-password')).resolves.toEqual({ ok: true });

    expect(transactionMock).toHaveBeenCalledOnce();
  });

  it('rejects an unknown token', async () => {
    tokenFindUniqueMock.mockResolvedValue(null);

    await expect(service.resetPassword('bogus', 'a-new-password')).rejects.toThrow(
      'This reset link is invalid or has expired.',
    );
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('rejects an expired token', async () => {
    tokenFindUniqueMock.mockResolvedValue(freshToken({ expiresAt: new Date(Date.now() - 1000) }));

    await expect(service.resetPassword('expired', 'a-new-password')).rejects.toThrow(
      'This reset link is invalid or has expired.',
    );
  });

  it('rejects a token that was already used', async () => {
    tokenFindUniqueMock.mockResolvedValue(freshToken({ usedAt: new Date() }));

    await expect(service.resetPassword('already-used', 'a-new-password')).rejects.toThrow(
      'This reset link is invalid or has expired.',
    );
  });
});
