import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import type { Readable } from 'node:stream';

const BUCKET_ENV_VAR = 'VOICE_NOTES_BUCKET';
const SIGNED_URL_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Durable object storage for voice notes, replacing local container disk —
 * local disk doesn't survive a Cloud Run redeploy/restart, and doesn't work
 * at all across multiple concurrently-running instances (maxScale > 1),
 * since each instance has its own separate disk.
 */
@Injectable()
export class VoiceNoteStorageService {
  private readonly storage = new Storage();

  private get bucketName(): string {
    const name = process.env[BUCKET_ENV_VAR];
    if (!name) {
      throw new InternalServerErrorException(`${BUCKET_ENV_VAR} is not set`);
    }
    return name;
  }

  /**
   * Deterministic per scan, not a fresh random name on every upload — a
   * retried or replaced voice note for the same scan overwrites the same
   * object instead of orphaning the previous one in the bucket forever.
   */
  objectKeyFor(clientScanId: string, extension: string): string {
    return `voice-notes/${clientScanId}.${extension}`;
  }

  async upload(objectKey: string, stream: Readable, contentType: string): Promise<void> {
    const file = this.storage.bucket(this.bucketName).file(objectKey);
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(file.createWriteStream({ contentType, resumable: false }))
        .on('error', reject)
        .on('finish', resolve);
    });
  }

  /**
   * A short-lived signed URL — retrieval redirects here rather than
   * proxying potentially large audio files through the API process.
   */
  async getSignedDownloadUrl(objectKey: string): Promise<string> {
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(objectKey)
      .getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + SIGNED_URL_EXPIRY_MS });
    return url;
  }
}
