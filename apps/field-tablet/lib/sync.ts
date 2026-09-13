import { API_URL, apiFetch, describeError, getToken } from "./api";
import {
  getPendingScans,
  getPendingVoiceNotes,
  markScanSynced,
  markVoiceNoteSynced,
} from "./database";

export type SyncStatus =
  | { state: "syncing" }
  | {
      state: "success";
      syncedCount: number;
      voiceNotesUploaded: number;
      voiceNotesFailed: number;
      at: Date;
    }
  | { state: "error"; message: string; at: Date };

interface SyncedScan {
  clientScanId: string;
  id: string;
}

let inFlight = false;

async function syncScanMetadata(capturedByUserId: string): Promise<number> {
  const pending = getPendingScans(capturedByUserId);
  if (pending.length === 0) return 0;

  const acknowledged = await apiFetch<SyncedScan[]>("/scans/sync", {
    method: "POST",
    body: JSON.stringify({
      scans: pending.map((scan) => ({
        clientScanId: scan.clientId,
        barcode: scan.barcode,
        scannedAt: scan.scannedAt,
        longitude: scan.longitude ?? undefined,
        latitude: scan.latitude ?? undefined,
      })),
    }),
  });

  const acknowledgedIds = new Set(acknowledged.map((scan) => scan.clientScanId));
  let syncedCount = 0;
  for (const scan of pending) {
    if (acknowledgedIds.has(scan.clientId)) {
      markScanSynced(scan.id);
      syncedCount++;
    }
  }
  return syncedCount;
}

/**
 * Voice notes upload one at a time (they're much bigger than a scan record)
 * and only after their scan's metadata has synced, since the server links
 * the file to an existing ScanEvent by clientScanId. A failed upload just
 * leaves that row queued for the next sync cycle — it doesn't stop the rest.
 */
interface VoiceNoteSyncResult {
  uploaded: number;
  failed: number;
}

async function syncVoiceNotes(capturedByUserId: string): Promise<VoiceNoteSyncResult> {
  const pending = getPendingVoiceNotes(capturedByUserId);
  let uploaded = 0;
  let failed = 0;

  for (const scan of pending) {
    if (!scan.voiceNoteUri) continue;

    const form = new FormData();
    // React Native's fetch/FormData accepts this {uri,name,type} shape for a local file.
    form.append("file", {
      uri: scan.voiceNoteUri,
      name: "voice-note.m4a",
      type: "audio/m4a",
    } as unknown as Blob);

    const token = await getToken();
    const res = await fetch(`${API_URL}/scans/${scan.clientId}/voice-note`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });

    if (res.ok) {
      markVoiceNoteSynced(scan.id);
      uploaded++;
    } else {
      // Row stays voiceNoteSynced = 0, so getPendingVoiceNotes picks it back
      // up next cycle -- but the caller still needs to know this happened,
      // or a rejected upload (e.g. unsupported file type, size limit) looks
      // identical to "nothing was pending" and reports as fully synced.
      failed++;
    }
  }

  return { uploaded, failed };
}

/**
 * One sync cycle: push queued scan metadata (idempotent, keyed by clientId),
 * then upload any voice notes attached to scans that are now confirmed on
 * the server. Only what the server acknowledges gets marked synced locally.
 *
 * Scoped to capturedByUserId throughout -- if a different user's scans are
 * still queued locally (they signed out before syncing), this cycle leaves
 * them untouched rather than uploading them under the current user's
 * identity. They sync correctly once that user signs back in.
 */
export async function syncPendingScans(capturedByUserId: string): Promise<SyncStatus> {
  if (inFlight) return { state: "syncing" };

  inFlight = true;
  try {
    const syncedCount = await syncScanMetadata(capturedByUserId);
    const { uploaded: voiceNotesUploaded, failed: voiceNotesFailed } =
      await syncVoiceNotes(capturedByUserId);
    return { state: "success", syncedCount, voiceNotesUploaded, voiceNotesFailed, at: new Date() };
  } catch (err) {
    return { state: "error", message: describeError(err), at: new Date() };
  } finally {
    inFlight = false;
  }
}
