import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { prisma } from '@repo/database';
import { CURRENT_BAA_TERMS_VERSION, STANDARD_BAA_TERMS_V1 } from './baa-terms.js';

export interface RecordAcceptanceInput {
  accountId: string;
  acceptedBy: string;
}

@Injectable()
export class BaaComplianceService {
  /** SHA-256 digest binding the account, signer, and exact terms text into one tamper-evident value. */
  generateDigest(accountId: string, acceptedBy: string, termsVersion: string): string {
    const payload = `${termsVersion}:${accountId}:${acceptedBy}:${STANDARD_BAA_TERMS_V1}`;
    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * The text a signer must actually be shown before their acceptance means
   * anything -- previously nothing exposed this, so client-portal's accept
   * form recorded a signature without ever displaying what was being agreed
   * to. termsVersion always comes from here, never from the caller: letting
   * a client name an arbitrary version would let it record a digest for
   * terms text no one actually reviewed.
   */
  getCurrentTerms(): { version: string; text: string } {
    return { version: CURRENT_BAA_TERMS_VERSION, text: STANDARD_BAA_TERMS_V1 };
  }

  async recordAcceptance(input: RecordAcceptanceInput) {
    const termsVersion = CURRENT_BAA_TERMS_VERSION;
    const digestSha256 = this.generateDigest(input.accountId, input.acceptedBy, termsVersion);

    return prisma.baaAcceptance.create({
      data: {
        accountId: input.accountId,
        acceptedBy: input.acceptedBy,
        termsVersion,
        digestSha256,
      },
    });
  }

  async hasCurrentAcceptance(accountId: string): Promise<boolean> {
    const count = await prisma.baaAcceptance.count({
      where: { accountId, termsVersion: CURRENT_BAA_TERMS_VERSION },
    });
    return count > 0;
  }
}
