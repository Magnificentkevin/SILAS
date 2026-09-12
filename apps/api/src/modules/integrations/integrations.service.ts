import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CredentialCipher, type AdapterPort } from '@repo/silas-core';
import { ConnectionStatus, prisma, type IntegrationCategory } from '@repo/database';
import { MaintainXAdapter } from './adapters/maintainx.adapter.js';
import type { CreateConnectionDto, DispatchConnectionDto } from './dto.js';

const ADAPTERS: Record<string, AdapterPort> = {
  MaintainX: new MaintainXAdapter(),
};

function getCipher(): CredentialCipher {
  const key = process.env.INTEGRATION_CREDENTIAL_KEY;
  if (!key) {
    throw new BadRequestException('INTEGRATION_CREDENTIAL_KEY is not set');
  }
  return new CredentialCipher(key);
}

/** Never let the sealed credential leave this module. */
function toSafeConnection<T extends { encryptedCredential: string }>(connection: T) {
  const { encryptedCredential, ...safe } = connection;
  return safe;
}

@Injectable()
export class IntegrationsService {
  listProviders(category?: IntegrationCategory) {
    return prisma.integrationProvider.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async createConnection(dto: CreateConnectionDto) {
    const account = await prisma.account.findUnique({ where: { id: dto.accountId } });
    if (!account) {
      throw new NotFoundException(`Unknown account: ${dto.accountId}`);
    }

    const provider = await prisma.integrationProvider.findUnique({ where: { id: dto.providerId } });
    if (!provider) {
      throw new NotFoundException(`Unknown integration provider: ${dto.providerId}`);
    }

    const cipher = getCipher();
    const encryptedCredential = cipher.seal(dto.credential);

    const connection = await prisma.integrationConnection.create({
      data: {
        accountId: dto.accountId,
        providerId: dto.providerId,
        label: dto.label,
        scopes: dto.scopes,
        encryptedCredential,
        status: ConnectionStatus.PENDING,
      },
      include: { provider: true },
    });

    return toSafeConnection(connection);
  }

  /** Staff-only today (see the controller), so this intentionally still
   *  allows an unscoped, cross-account listing when accountId is omitted --
   *  ADMIN/OPERATOR already have blanket visibility everywhere else in this
   *  codebase. The filter exists so staff *can* scope their own view, and so
   *  a future non-staff-facing endpoint has a real boundary to enforce. */
  async listConnections(accountId?: string) {
    const connections = await prisma.integrationConnection.findMany({
      where: accountId ? { accountId } : undefined,
      include: { provider: true },
      orderBy: { createdAt: 'desc' },
    });
    return connections.map(toSafeConnection);
  }

  /**
   * Proves the sealed credential is intact and decryptable without ever
   * returning it — the closest thing to a health check this reference
   * implementation performs before a real adapter call would use it.
   */
  async verifyConnection(id: string) {
    const connection = await prisma.integrationConnection.findUnique({ where: { id } });
    if (!connection) {
      throw new NotFoundException(`Unknown connection: ${id}`);
    }
    // REVOKED is a deliberate, human-initiated termination -- a health-check
    // pass must never silently reactivate it back to CONNECTED. Reconnecting
    // is an explicit act (a new connection), not a side effect of verifying.
    if (connection.status === ConnectionStatus.REVOKED) {
      throw new ForbiddenException(
        `Connection ${id} has been revoked. Create a new connection to reconnect -- verification cannot reactivate a revoked one.`,
      );
    }

    const cipher = getCipher();
    try {
      cipher.open(connection.encryptedCredential);
    } catch {
      const failed = await prisma.integrationConnection.update({
        where: { id },
        data: { status: ConnectionStatus.ERROR },
        include: { provider: true },
      });
      return toSafeConnection(failed);
    }

    const verified = await prisma.integrationConnection.update({
      where: { id },
      data: { status: ConnectionStatus.CONNECTED, lastVerifiedAt: new Date() },
      include: { provider: true },
    });
    return toSafeConnection(verified);
  }

  /** Opens the sealed credential just long enough to hand it to the matching adapter. */
  async dispatch(connectionId: string, dto: DispatchConnectionDto) {
    const connection = await prisma.integrationConnection.findUnique({
      where: { id: connectionId },
      include: { provider: true },
    });
    if (!connection) {
      throw new NotFoundException(`Unknown connection: ${connectionId}`);
    }
    // Dispatch requires an actually-active connection -- PENDING (never
    // verified), ERROR (failed verification), and REVOKED (deliberately
    // terminated) must all reject, not just REVOKED specifically.
    if (connection.status !== ConnectionStatus.CONNECTED) {
      throw new ForbiddenException(
        `Connection ${connectionId} is ${connection.status}, not CONNECTED -- dispatch requires an active, verified connection.`,
      );
    }

    const adapter = ADAPTERS[connection.provider.name];
    if (!adapter) {
      throw new BadRequestException(`No adapter registered for provider ${connection.provider.name}`);
    }

    const cipher = getCipher();
    const credential = cipher.open(connection.encryptedCredential);

    return adapter.dispatch({ operation: dto.operation, payload: dto.payload }, credential);
  }

  async revokeConnection(id: string) {
    const connection = await prisma.integrationConnection.update({
      where: { id },
      data: { status: ConnectionStatus.REVOKED },
      include: { provider: true },
    });
    return toSafeConnection(connection);
  }
}
