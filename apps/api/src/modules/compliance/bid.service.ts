import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';

export interface SubmitBidInput {
  accountId: string;
  vendorId: string;
  amountCents: number;
  description?: string;
}

@Injectable()
export class BidService {
  /** Persists a vendor's bid — the durable record operations reads, not just an HTTP echo. */
  async submitBid(input: SubmitBidInput) {
    return prisma.bid.create({
      data: {
        accountId: input.accountId,
        vendorId: input.vendorId,
        amountCents: input.amountCents,
        description: input.description,
      },
    });
  }

  /** Staff retrieval of bids on an account — the piece that was entirely missing before. */
  async listBidsForAccount(accountId: string) {
    return prisma.bid.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
