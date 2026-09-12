import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CredentialCipher } from '@repo/silas-core';

const findUniqueMock = vi.fn();
const updateMock = vi.fn();
const createMock = vi.fn();
const findManyMock = vi.fn();
const accountFindUniqueMock = vi.fn();
const providerFindUniqueMock = vi.fn();

vi.mock('@repo/database', async () => {
  const actual = await vi.importActual<typeof import('@prisma/client')>('@prisma/client');
  return {
    ConnectionStatus: actual.ConnectionStatus,
    prisma: {
      integrationConnection: {
        findUnique: findUniqueMock,
        update: updateMock,
        create: createMock,
        findMany: findManyMock,
      },
      account: {
        findUnique: accountFindUniqueMock,
      },
      integrationProvider: {
        findUnique: providerFindUniqueMock,
      },
    },
  };
});

const { IntegrationsService } = await import('./integrations.service.js');

const KEY = CredentialCipher.generateKey();
const cipher = new CredentialCipher(KEY);
const SEALED = cipher.seal('sk_live_test_credential');

function connection(status: 'PENDING' | 'CONNECTED' | 'ERROR' | 'REVOKED') {
  return {
    id: 'conn-1',
    accountId: 'account-1',
    providerId: 'provider-1',
    label: 'Test connection',
    scopes: [],
    encryptedCredential: SEALED,
    status,
    lastVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    provider: { id: 'provider-1', name: 'MaintainX', category: 'FACILITY_MANAGEMENT' },
  };
}

describe('IntegrationsService', () => {
  let service: InstanceType<typeof IntegrationsService>;
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.INTEGRATION_CREDENTIAL_KEY = KEY;
    findUniqueMock.mockReset();
    updateMock.mockReset();
    createMock.mockReset();
    findManyMock.mockReset();
    accountFindUniqueMock.mockReset();
    providerFindUniqueMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    service = new IntegrationsService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('dispatch', () => {
    it.each(['PENDING', 'ERROR', 'REVOKED'] as const)(
      'rejects dispatch on a %s connection without ever calling the adapter',
      async (status) => {
        findUniqueMock.mockResolvedValue(connection(status));

        await expect(service.dispatch('conn-1', { operation: 'op', payload: {} })).rejects.toThrow(
          `not CONNECTED`,
        );
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    it('allows dispatch on a CONNECTED connection', async () => {
      findUniqueMock.mockResolvedValue(connection('CONNECTED'));
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'wo_123' }) });

      const result = await service.dispatch('conn-1', { operation: 'op', payload: {} });

      expect(result).toMatchObject({ ok: true });
      expect(fetchMock).toHaveBeenCalledOnce();
    });
  });

  describe('createConnection', () => {
    it('attributes a new connection to the given account, never leaving it unscoped', async () => {
      accountFindUniqueMock.mockResolvedValue({ id: 'account-1', name: 'Test Account' });
      providerFindUniqueMock.mockResolvedValue({ id: 'provider-1', name: 'MaintainX' });
      createMock.mockResolvedValue(connection('PENDING'));

      await service.createConnection({
        accountId: 'account-1',
        providerId: 'provider-1',
        label: 'Test connection',
        scopes: [],
        credential: 'sk_live_test_credential',
      });

      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ accountId: 'account-1' }) }),
      );
    });

    it('rejects creating a connection for an account that does not exist', async () => {
      accountFindUniqueMock.mockResolvedValue(null);

      await expect(
        service.createConnection({
          accountId: 'nonexistent-account',
          providerId: 'provider-1',
          label: 'Test connection',
          scopes: [],
          credential: 'sk_live_test_credential',
        }),
      ).rejects.toThrow('Unknown account');
      expect(createMock).not.toHaveBeenCalled();
    });
  });

  describe('listConnections', () => {
    it('scopes the listing to one account when accountId is given -- the boundary a future non-staff endpoint needs', async () => {
      findManyMock.mockResolvedValue([connection('CONNECTED')]);

      await service.listConnections('account-1');

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({ where: { accountId: 'account-1' } }),
      );
    });

    it('lists across all accounts when no accountId is given -- staff already has blanket visibility', async () => {
      findManyMock.mockResolvedValue([connection('CONNECTED')]);

      await service.listConnections();

      expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }));
    });
  });

  describe('verifyConnection', () => {
    it('rejects verifying (and reactivating) a REVOKED connection', async () => {
      findUniqueMock.mockResolvedValue(connection('REVOKED'));

      await expect(service.verifyConnection('conn-1')).rejects.toThrow('has been revoked');
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('moves a PENDING connection to CONNECTED on successful verification', async () => {
      findUniqueMock.mockResolvedValue(connection('PENDING'));
      updateMock.mockResolvedValue(connection('CONNECTED'));

      const result = await service.verifyConnection('conn-1');

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'CONNECTED' }) }),
      );
      expect(result.status).toBe('CONNECTED');
    });
  });
});
