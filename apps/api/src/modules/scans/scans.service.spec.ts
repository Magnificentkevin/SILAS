import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MultipartFile } from '@fastify/multipart';
import type { JwtPayload } from '../auth/jwt-payload.js';

const findUniqueMock = vi.fn();
const updateMock = vi.fn();

vi.mock('@repo/database', () => ({
  prisma: {
    scanEvent: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
  },
  Prisma: { sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }) },
}));

const objectKeyForMock = vi.fn();
const uploadMock = vi.fn();
const getSignedDownloadUrlMock = vi.fn();

vi.mock('./voice-note-storage.service.js', () => ({
  VoiceNoteStorageService: vi.fn().mockImplementation(function VoiceNoteStorageService(this: unknown) {
    Object.assign(this as object, {
      objectKeyFor: objectKeyForMock,
      upload: uploadMock,
      getSignedDownloadUrl: getSignedDownloadUrlMock,
    });
  }),
}));

const { ScansService } = await import('./scans.service.js');
const { VoiceNoteStorageService } = await import('./voice-note-storage.service.js');

function jwtPayload(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    sub: 'user-a',
    email: 'user-a@example.com',
    globalRole: null,
    memberships: [],
    csrfToken: 'test-csrf-token',
    ...overrides,
  };
}

function fakeFile(): MultipartFile {
  return {
    mimetype: 'audio/m4a',
    filename: 'note.m4a',
    file: { truncated: false },
  } as unknown as MultipartFile;
}

describe('ScansService.attachVoiceNote', () => {
  let service: InstanceType<typeof ScansService>;

  beforeEach(() => {
    findUniqueMock.mockReset();
    updateMock.mockReset();
    objectKeyForMock.mockReset();
    uploadMock.mockReset();
    getSignedDownloadUrlMock.mockReset();
    objectKeyForMock.mockReturnValue('voice-notes/scan-1.m4a');
    uploadMock.mockResolvedValue(undefined);
    service = new ScansService(new VoiceNoteStorageService());
  });

  it('allows the user who captured the scan to attach its recording', async () => {
    findUniqueMock.mockResolvedValue({ clientScanId: 'scan-1', scannedByUserId: 'user-a' });
    updateMock.mockResolvedValue({});

    await expect(service.attachVoiceNote('scan-1', fakeFile(), jwtPayload({ sub: 'user-a' }))).resolves.toMatchObject({
      voiceNoteUri: 'voice-notes/scan-1.m4a',
    });
    expect(uploadMock).toHaveBeenCalledWith('voice-notes/scan-1.m4a', expect.anything(), 'audio/m4a');
  });

  it('denies a different user from overwriting someone else\'s scan recording', async () => {
    findUniqueMock.mockResolvedValue({ clientScanId: 'scan-1', scannedByUserId: 'user-a' });

    await expect(
      service.attachVoiceNote('scan-1', fakeFile(), jwtPayload({ sub: 'user-b', globalRole: null })),
    ).rejects.toThrow('You did not capture this scan');
    expect(updateMock).not.toHaveBeenCalled();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('allows staff (any globalRole) to attach a recording on someone else\'s scan', async () => {
    findUniqueMock.mockResolvedValue({ clientScanId: 'scan-1', scannedByUserId: 'user-a' });
    updateMock.mockResolvedValue({});

    await expect(
      service.attachVoiceNote('scan-1', fakeFile(), jwtPayload({ sub: 'staff-1', globalRole: 'OPERATOR' })),
    ).resolves.toMatchObject({ voiceNoteUri: expect.any(String) });
  });

  it('denies a non-staff user when the scan has no recorded capturer', async () => {
    findUniqueMock.mockResolvedValue({ clientScanId: 'scan-1', scannedByUserId: null });

    await expect(
      service.attachVoiceNote('scan-1', fakeFile(), jwtPayload({ sub: 'user-b', globalRole: null })),
    ).rejects.toThrow('You did not capture this scan');
  });
});

describe('ScansService.getVoiceNoteDownloadUrl', () => {
  let service: InstanceType<typeof ScansService>;

  beforeEach(() => {
    findUniqueMock.mockReset();
    getSignedDownloadUrlMock.mockReset();
    service = new ScansService(new VoiceNoteStorageService());
  });

  it('returns a signed URL for the user who captured the scan', async () => {
    findUniqueMock.mockResolvedValue({ clientScanId: 'scan-1', scannedByUserId: 'user-a', voiceNoteUri: 'voice-notes/scan-1.m4a' });
    getSignedDownloadUrlMock.mockResolvedValue('https://storage.googleapis.com/signed-url');

    await expect(
      service.getVoiceNoteDownloadUrl('scan-1', jwtPayload({ sub: 'user-a' })),
    ).resolves.toEqual({ url: 'https://storage.googleapis.com/signed-url' });
    expect(getSignedDownloadUrlMock).toHaveBeenCalledWith('voice-notes/scan-1.m4a');
  });

  it('allows staff to retrieve a recording on someone else\'s scan', async () => {
    findUniqueMock.mockResolvedValue({ clientScanId: 'scan-1', scannedByUserId: 'user-a', voiceNoteUri: 'voice-notes/scan-1.m4a' });
    getSignedDownloadUrlMock.mockResolvedValue('https://storage.googleapis.com/signed-url');

    await expect(
      service.getVoiceNoteDownloadUrl('scan-1', jwtPayload({ sub: 'staff-1', globalRole: 'OPERATOR' })),
    ).resolves.toEqual({ url: 'https://storage.googleapis.com/signed-url' });
  });

  it('denies a different non-staff user from retrieving the recording', async () => {
    findUniqueMock.mockResolvedValue({ clientScanId: 'scan-1', scannedByUserId: 'user-a', voiceNoteUri: 'voice-notes/scan-1.m4a' });

    await expect(
      service.getVoiceNoteDownloadUrl('scan-1', jwtPayload({ sub: 'user-b', globalRole: null })),
    ).rejects.toThrow('You did not capture this scan');
    expect(getSignedDownloadUrlMock).not.toHaveBeenCalled();
  });

  it('throws not found when the scan has no voice note attached', async () => {
    findUniqueMock.mockResolvedValue({ clientScanId: 'scan-1', scannedByUserId: 'user-a', voiceNoteUri: null });

    await expect(
      service.getVoiceNoteDownloadUrl('scan-1', jwtPayload({ sub: 'user-a' })),
    ).rejects.toThrow('Scan scan-1 has no voice note attached');
  });

  it('throws not found for an unknown clientScanId', async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(
      service.getVoiceNoteDownloadUrl('scan-unknown', jwtPayload({ sub: 'user-a' })),
    ).rejects.toThrow('Unknown scan: scan-unknown');
  });
});
