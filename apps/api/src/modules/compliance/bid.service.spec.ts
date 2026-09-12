import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();
const findManyMock = vi.fn();

vi.mock('@repo/database', () => ({
  prisma: {
    bid: {
      create: createMock,
      findMany: findManyMock,
    },
  },
}));

const { BidService } = await import('./bid.service.js');

describe('BidService', () => {
  let service: InstanceType<typeof BidService>;

  beforeEach(() => {
    createMock.mockReset();
    findManyMock.mockReset();
    service = new BidService();
  });

  it('persists a submitted bid with the caller as vendor', async () => {
    createMock.mockResolvedValue({
      id: 'bid-1',
      accountId: 'account-1',
      vendorId: 'vendor-1',
      amountCents: 50000,
      description: 'Plumbing repair',
      status: 'SUBMITTED',
    });

    const result = await service.submitBid({
      accountId: 'account-1',
      vendorId: 'vendor-1',
      amountCents: 50000,
      description: 'Plumbing repair',
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        accountId: 'account-1',
        vendorId: 'vendor-1',
        amountCents: 50000,
        description: 'Plumbing repair',
      },
    });
    expect(result).toMatchObject({ id: 'bid-1', status: 'SUBMITTED' });
  });

  it('lists bids for an account, most recent first', async () => {
    findManyMock.mockResolvedValue([{ id: 'bid-2' }, { id: 'bid-1' }]);

    const result = await service.listBidsForAccount('account-1');

    expect(findManyMock).toHaveBeenCalledWith({
      where: { accountId: 'account-1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toHaveLength(2);
  });
});
