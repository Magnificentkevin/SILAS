import { Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@repo/database';

export const VENDOR_PAYABLE_CODE = '2100-VENDOR-PAYABLE';
export const FBO_OPERATING_CODE = '1010-SILAS-FBO-OPERATING';

const PRISMA_UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

const WITH_POSTINGS = { postings: { include: { ledgerAccount: true } } } as const;

@Injectable()
export class JournalService {
  /**
   * Atomically posts a balanced DEBIT vendor-payable / CREDIT FBO-operating
   * entry. Idempotent on settlementKey: a response-loss retry or a genuinely
   * concurrent duplicate request returns the original posting instead of
   * creating a second one. The upfront check handles the common case cheaply;
   * the settlementKey unique constraint (caught below) is what actually makes
   * this safe under concurrency, since two requests can both pass the upfront
   * check before either commits.
   */
  async postSettlement(amountCents: number, description: string, settlementKey: string) {
    const existing = await prisma.journalEntry.findUnique({
      where: { settlementKey },
      include: WITH_POSTINGS,
    });
    if (existing) {
      return existing;
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const [vendorPayable, fboOperating] = await Promise.all([
          tx.ledgerAccount.findUniqueOrThrow({ where: { code: VENDOR_PAYABLE_CODE } }),
          tx.ledgerAccount.findUniqueOrThrow({ where: { code: FBO_OPERATING_CODE } }),
        ]);

        const journalEntry = await tx.journalEntry.create({ data: { description, settlementKey } });

        await tx.ledgerPosting.createMany({
          data: [
            {
              journalEntryId: journalEntry.id,
              ledgerAccountId: vendorPayable.id,
              direction: 'DEBIT',
              amountCents,
            },
            {
              journalEntryId: journalEntry.id,
              ledgerAccountId: fboOperating.id,
              direction: 'CREDIT',
              amountCents,
            },
          ],
        });

        return tx.journalEntry.findUniqueOrThrow({
          where: { id: journalEntry.id },
          include: WITH_POSTINGS,
        });
      });
    } catch (err) {
      const lostTheRace =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === PRISMA_UNIQUE_CONSTRAINT_VIOLATION;
      if (!lostTheRace) {
        throw err;
      }
      // Another concurrent request inserted first — return its result rather
      // than erroring, so a duplicate request looks identical to a replay.
      return prisma.journalEntry.findUniqueOrThrow({
        where: { settlementKey },
        include: WITH_POSTINGS,
      });
    }
  }
}
