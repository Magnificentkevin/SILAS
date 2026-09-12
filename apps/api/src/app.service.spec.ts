import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryRawMock = vi.fn();

vi.mock('@repo/database', () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

const { AppService } = await import('./app.service.js');

describe('AppService.checkHealth', () => {
  let service: InstanceType<typeof AppService>;

  beforeEach(() => {
    queryRawMock.mockReset();
    service = new AppService();
  });

  it('reports ok when the database round-trip succeeds', async () => {
    queryRawMock.mockResolvedValue([{ '?column?': 1 }]);

    await expect(service.checkHealth()).resolves.toEqual({ status: 'ok', database: 'connected' });
  });

  it('throws a 503 when the database is unreachable, instead of reporting healthy', async () => {
    queryRawMock.mockRejectedValue(new Error('connection refused'));

    await expect(service.checkHealth()).rejects.toThrow('Database unreachable: connection refused');
  });
});
