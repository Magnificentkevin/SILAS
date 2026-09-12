import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, prisma, type ScanEvent } from '@repo/database';
import type { JwtPayload } from '../auth/jwt-payload.js';
import { VoiceNoteStorageService } from './voice-note-storage.service.js';
import type { SyncScansDto } from './dto.js';
import type { MultipartFile } from '@fastify/multipart';

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/m4a',
  'audio/mp4',
  'audio/x-m4a',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/aac',
]);

export interface SyncedScan {
  clientScanId: string;
  id: string;
}

@Injectable()
export class ScansService {
  constructor(private readonly voiceNoteStorage: VoiceNoteStorageService) {}

  /**
   * Idempotent upsert keyed on clientScanId: retried syncs of an
   * already-received scan return the same row instead of duplicating it,
   * which is what an intermittently-connected field device needs.
   * scannedByUserId is set only on first insert — a retried sync never
   * overwrites who originally captured the scan.
   */
  async sync(dto: SyncScansDto, userId: string): Promise<SyncedScan[]> {
    const results: SyncedScan[] = [];

    for (const scan of dto.scans) {
      const hasLocation = scan.longitude != null && scan.latitude != null;
      const locationExpr = hasLocation
        ? Prisma.sql`ST_SetSRID(ST_MakePoint(${scan.longitude}, ${scan.latitude}), 4326)`
        : Prisma.sql`NULL`;

      const [row] = await prisma.$queryRaw<SyncedScan[]>`
        INSERT INTO scan_events (id, "clientScanId", barcode, "scannedAt", location, "scannedByUserId")
        VALUES (gen_random_uuid(), ${scan.clientScanId}, ${scan.barcode}, ${new Date(scan.scannedAt)}, ${locationExpr}, ${userId})
        ON CONFLICT ("clientScanId") DO UPDATE SET "clientScanId" = EXCLUDED."clientScanId"
        RETURNING id, "clientScanId"
      `;

      if (row) results.push(row);
    }

    return results;
  }

  /** Streams an uploaded voice note to durable object storage and links it to its scan by clientScanId. */
  async attachVoiceNote(
    clientScanId: string,
    file: MultipartFile,
    user: JwtPayload,
  ): Promise<{ voiceNoteUri: string }> {
    if (!ALLOWED_AUDIO_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported audio type: ${file.mimetype}`);
    }

    const existing = await this.findScanOrThrow(clientScanId);
    this.assertCanAccessScan(existing, user);

    const extension = file.filename.includes('.') ? (file.filename.split('.').pop() ?? 'm4a') : 'm4a';
    const objectKey = this.voiceNoteStorage.objectKeyFor(clientScanId, extension);

    await this.voiceNoteStorage.upload(objectKey, file.file, file.mimetype);
    if (file.file.truncated) {
      throw new BadRequestException('Voice note exceeds the maximum upload size');
    }

    await prisma.scanEvent.update({ where: { clientScanId }, data: { voiceNoteUri: objectKey } });

    return { voiceNoteUri: objectKey };
  }

  /**
   * A short-lived signed URL to the voice note's actual bytes — retrieval was
   * previously an unauthenticated public static path; this is the "authorized
   * retrieval" half of that fix, gated by the same ownership rule as upload.
   */
  async getVoiceNoteDownloadUrl(clientScanId: string, user: JwtPayload): Promise<{ url: string }> {
    const existing = await this.findScanOrThrow(clientScanId);
    this.assertCanAccessScan(existing, user);

    if (!existing.voiceNoteUri) {
      throw new NotFoundException(`Scan ${clientScanId} has no voice note attached`);
    }

    const url = await this.voiceNoteStorage.getSignedDownloadUrl(existing.voiceNoteUri);
    return { url };
  }

  private async findScanOrThrow(clientScanId: string): Promise<ScanEvent> {
    const existing = await prisma.scanEvent.findUnique({ where: { clientScanId } });
    if (!existing) {
      throw new NotFoundException(`Unknown scan: ${clientScanId}`);
    }
    return existing;
  }

  /** Only the field user who captured the scan, or staff, may access its voice note. */
  private assertCanAccessScan(scan: ScanEvent, user: JwtPayload): void {
    const isOwner = scan.scannedByUserId === user.sub;
    const isStaff = user.globalRole != null;
    if (!isOwner && !isStaff) {
      throw new ForbiddenException('You did not capture this scan');
    }
  }
}
