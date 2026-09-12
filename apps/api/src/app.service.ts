import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  /** A real DB round-trip, not just "the process didn't crash" -- Cloud Run
   *  has no built-in app-level health check, so this is the one thing that
   *  can actually tell an external monitor the service is genuinely serving
   *  traffic, not just listening on a port. */
  async checkHealth(): Promise<{ status: 'ok'; database: 'connected' }> {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      throw new ServiceUnavailableException(
        `Database unreachable: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return { status: 'ok', database: 'connected' };
  }
}
