import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUniqueMock = vi.fn();
const findUniqueOrThrowMock = vi.fn();
const transactionMock = vi.fn();

vi.mock('@repo/database', async () => {
  const actual = await vi.importActual<typeof import('@prisma/client')>('@prisma/client');
  return {
    Prisma: actual.Prisma,
    prisma: {
      journalEntry: {
        findUnique: findUniqueMock,
        findUniqueOrThrow: findUniqueOrThrowMock,
      },
      $transaction: transactionMock,
    },
  };
});

const { Prisma } = await import('@repo/database');
const { JournalService } = await import('./journal.service.js');

function fakeTx(journalEntryId: string) {
  return {
    ledgerAccount: {
      findUniqueOrThrow: vi.fn().mockImplementation(({ where: { code } }: { where: { code: string } }) =>
        Promise.resolve({ id: `account-${code}`, code }),
      ),
    },
    journalEntry: {
      create: vi.fn().mockResolvedValue({ id: journalEntryId }),
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: journalEntryId,
        description: 'test',
        settlementKey: 'settlement-1',
        postings: [],
      }),
    },
    ledgerPosting: {
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
  };
}

describe('JournalService.postSettlement', () => {
  let service: InstanceType<typeof JournalService>;

  beforeEach(() => {
    findUniqueMock.mockReset();
    findUniqueOrThrowMock.mockReset();
    transactionMock.mockReset();
    service = new JournalService();
  });

  it('posts a new balanced journal entry when no prior entry exists for this settlementKey', async () => {
    findUniqueMock.mockResolvedValue(null);
    const tx = fakeTx('entry-1');
    transactionMock.mockImplementation((callback: (tx: unknown) => unknown) => callback(tx));

    const result = await service.postSettlement(5000, 'test settlement', 'settlement-1');

    expect(result).toMatchObject({ id: 'entry-1' });
    expect(tx.journalEntry.create).toHaveBeenCalledWith({
      data: { description: 'test settlement', settlementKey: 'settlement-1' },
    });
    expect(tx.ledgerPosting.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ direction: 'DEBIT', amountCents: 5000 }),
        expect.objectContaining({ direction: 'CREDIT', amountCents: 5000 }),
      ],
    });
  });

  it('returns the original entry on a sequential retry with the same settlementKey, without posting again', async () => {
    findUniqueMock.mockResolvedValue({ id: 'entry-1', settlementKey: 'settlement-1', postings: [] });

    const result = await service.postSettlement(5000, 'test settlement', 'settlement-1');

    expect(result).toMatchObject({ id: 'entry-1' });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('returns the winning entry on a concurrent duplicate instead of erroring or double-posting', async () => {
    // Both concurrent requests see no existing entry at first...
    findUniqueMock.mockResolvedValue(null);
    // ...but this request's transaction loses the race: the unique
    // constraint rejects its insert because the other request committed first.
    const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.19.3',
    });
    transactionMock.mockRejectedValue(uniqueConstraintError);
    findUniqueOrThrowMock.mockResolvedValue({ id: 'entry-1', settlementKey: 'settlement-1', postings: [] });

    const result = await service.postSettlement(5000, 'test settlement', 'settlement-1');

    expect(result).toMatchObject({ id: 'entry-1' });
    expect(findUniqueOrThrowMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { settlementKey: 'settlement-1' } }),
    );
  });

  it('does not swallow errors unrelated to the idempotency constraint', async () => {
    findUniqueMock.mockResolvedValue(null);
    transactionMock.mockRejectedValue(new Error('ledger account not found'));

    await expect(service.postSettlement(5000, 'test settlement', 'settlement-1')).rejects.toThrow(
      'ledger account not found',
    );
  });
});
