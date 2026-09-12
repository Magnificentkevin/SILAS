import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();
const countMock = vi.fn();

vi.mock('@repo/database', () => ({
  prisma: {
    baaAcceptance: {
      create: createMock,
      count: countMock,
    },
  },
}));

const { BaaComplianceService } = await import('./baa-compliance.service.js');
const { CURRENT_BAA_TERMS_VERSION, STANDARD_BAA_TERMS_V1 } = await import('./baa-terms.js');

describe('BaaComplianceService', () => {
  let service: InstanceType<typeof BaaComplianceService>;

  beforeEach(() => {
    createMock.mockReset();
    countMock.mockReset();
    service = new BaaComplianceService();
  });

  it('returns the current terms version and the exact text the digest is generated over', () => {
    const terms = service.getCurrentTerms();

    expect(terms.version).toBe(CURRENT_BAA_TERMS_VERSION);
    expect(terms.text).toBe(STANDARD_BAA_TERMS_V1);
  });

  it('records acceptance against the current terms version regardless of any caller-supplied one', async () => {
    createMock.mockResolvedValue({ id: 'acceptance-1' });

    await service.recordAcceptance({
      accountId: 'account-1',
      acceptedBy: 'jane@example.com',
      // @ts-expect-error -- the input type no longer accepts this; a raw client body still could
      termsVersion: 'a-made-up-version',
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accountId: 'account-1',
        acceptedBy: 'jane@example.com',
        termsVersion: CURRENT_BAA_TERMS_VERSION,
      }),
    });
  });

  it('generates the same digest for the same inputs and a different one for a different signer', () => {
    const digestA = service.generateDigest('account-1', 'jane@example.com', CURRENT_BAA_TERMS_VERSION);
    const digestB = service.generateDigest('account-1', 'jane@example.com', CURRENT_BAA_TERMS_VERSION);
    const digestC = service.generateDigest('account-1', 'john@example.com', CURRENT_BAA_TERMS_VERSION);

    expect(digestA).toBe(digestB);
    expect(digestA).not.toBe(digestC);
  });

  it('reports no current acceptance when none exists', async () => {
    countMock.mockResolvedValue(0);

    await expect(service.hasCurrentAcceptance('account-1')).resolves.toBe(false);
    expect(countMock).toHaveBeenCalledWith({
      where: { accountId: 'account-1', termsVersion: CURRENT_BAA_TERMS_VERSION },
    });
  });

  it('reports a current acceptance when one is on file', async () => {
    countMock.mockResolvedValue(1);

    await expect(service.hasCurrentAcceptance('account-1')).resolves.toBe(true);
  });
});
