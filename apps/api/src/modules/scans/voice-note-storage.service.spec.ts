import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';

const createWriteStreamMock = vi.fn();
const getSignedUrlMock = vi.fn();
const fileMock = vi.fn();
const bucketMock = vi.fn();

vi.mock('@google-cloud/storage', () => ({
  Storage: vi.fn().mockImplementation(function Storage(this: unknown) {
    Object.assign(this as object, { bucket: bucketMock });
  }),
}));

const { VoiceNoteStorageService } = await import('./voice-note-storage.service.js');

describe('VoiceNoteStorageService', () => {
  let service: InstanceType<typeof VoiceNoteStorageService>;

  beforeEach(() => {
    process.env.VOICE_NOTES_BUCKET = 'silas-voice-notes-test';
    bucketMock.mockReset();
    fileMock.mockReset();
    createWriteStreamMock.mockReset();
    getSignedUrlMock.mockReset();
    bucketMock.mockReturnValue({ file: fileMock });
    fileMock.mockReturnValue({
      createWriteStream: createWriteStreamMock,
      getSignedUrl: getSignedUrlMock,
    });
    service = new VoiceNoteStorageService();
  });

  it('builds a deterministic object key from the clientScanId and extension', () => {
    expect(service.objectKeyFor('scan-1', 'm4a')).toBe('voice-notes/scan-1.m4a');
  });

  it('throws when VOICE_NOTES_BUCKET is not configured', async () => {
    delete process.env.VOICE_NOTES_BUCKET;

    await expect(service.getSignedDownloadUrl('voice-notes/scan-1.m4a')).rejects.toThrow(
      'VOICE_NOTES_BUCKET is not set',
    );
  });

  it('pipes the upload stream into a GCS write stream and resolves on finish', async () => {
    const events: Record<string, (...args: unknown[]) => void> = {};
    const writeStream = {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        events[event] = handler;
        return writeStream;
      }),
    };
    createWriteStreamMock.mockReturnValue(writeStream);

    const source = new Readable({ read() {} });
    // pipe() needs a real target -- stub just enough for Readable to treat it as a writable
    const pipeTarget = Object.assign(writeStream, { write: vi.fn(), end: vi.fn(), once: vi.fn(), emit: vi.fn() });
    vi.spyOn(source, 'pipe').mockReturnValue(pipeTarget as never);

    const uploadPromise = service.upload('voice-notes/scan-1.m4a', source, 'audio/m4a');
    events.finish?.();
    await expect(uploadPromise).resolves.toBeUndefined();

    expect(bucketMock).toHaveBeenCalledWith('silas-voice-notes-test');
    expect(fileMock).toHaveBeenCalledWith('voice-notes/scan-1.m4a');
    expect(createWriteStreamMock).toHaveBeenCalledWith({ contentType: 'audio/m4a', resumable: false });
  });

  it('rejects when the GCS write stream errors', async () => {
    const events: Record<string, (...args: unknown[]) => void> = {};
    const writeStream = {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        events[event] = handler;
        return writeStream;
      }),
    };
    createWriteStreamMock.mockReturnValue(writeStream);

    const source = new Readable({ read() {} });
    const pipeTarget = Object.assign(writeStream, { write: vi.fn(), end: vi.fn(), once: vi.fn(), emit: vi.fn() });
    vi.spyOn(source, 'pipe').mockReturnValue(pipeTarget as never);

    const uploadPromise = service.upload('voice-notes/scan-1.m4a', source, 'audio/m4a');
    const boom = new Error('boom');
    events.error?.(boom);

    await expect(uploadPromise).rejects.toThrow('boom');
  });

  it('returns a 15-minute signed URL for reading the object', async () => {
    getSignedUrlMock.mockResolvedValue(['https://storage.googleapis.com/signed-url']);
    const before = Date.now();

    await expect(service.getSignedDownloadUrl('voice-notes/scan-1.m4a')).resolves.toBe(
      'https://storage.googleapis.com/signed-url',
    );

    expect(fileMock).toHaveBeenCalledWith('voice-notes/scan-1.m4a');
    const [[call]] = getSignedUrlMock.mock.calls;
    expect(call.action).toBe('read');
    expect(call.version).toBe('v4');
    expect(call.expires).toBeGreaterThanOrEqual(before + 14 * 60 * 1000);
    expect(call.expires).toBeLessThanOrEqual(before + 16 * 60 * 1000);
  });
});
