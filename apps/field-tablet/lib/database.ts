import * as SQLite from "expo-sqlite";
import type { ScanAsset } from "@repo/contracts";

const db = SQLite.openDatabaseSync("field-tablet.db");

db.execSync(`
  CREATE TABLE IF NOT EXISTS pending_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId TEXT NOT NULL UNIQUE,
    barcode TEXT NOT NULL,
    scannedAt TEXT NOT NULL,
    longitude REAL,
    latitude REAL,
    voiceNoteUri TEXT,
    voiceNoteSynced INTEGER NOT NULL DEFAULT 0,
    synced INTEGER NOT NULL DEFAULT 0,
    capturedByUserId TEXT
  );
`);

// Devices that already had this table before capturedByUserId existed need an
// explicit migration -- CREATE TABLE IF NOT EXISTS is a no-op for them, so the
// column would otherwise never appear. SQLite throws "duplicate column name"
// once this has already run; that's the expected, safe outcome on every
// subsequent app launch, not an error worth surfacing.
try {
  db.execSync(`ALTER TABLE pending_scans ADD COLUMN capturedByUserId TEXT;`);
} catch {
  // Already migrated.
}

function generateClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * capturedByUserId partitions the local queue by who scanned it, so switching
 * accounts on a shared device can't misattribute or leak another user's
 * pending work -- see the getPendingScans/getRecentScans/getPendingVoiceNotes
 * filters below, which are the other half of this.
 */
export function queueScan(scan: ScanAsset, capturedByUserId: string): number {
  const result = db.runSync(
    "INSERT INTO pending_scans (clientId, barcode, scannedAt, longitude, latitude, capturedByUserId) VALUES (?, ?, ?, ?, ?, ?)",
    generateClientId(),
    scan.barcode,
    scan.scannedAt,
    scan.location?.coordinates[0] ?? null,
    scan.location?.coordinates[1] ?? null,
    capturedByUserId,
  );
  return result.lastInsertRowId;
}

export function attachVoiceNote(scanId: number, voiceNoteUri: string) {
  db.runSync("UPDATE pending_scans SET voiceNoteUri = ? WHERE id = ?", voiceNoteUri, scanId);
}

export interface PendingScan {
  id: number;
  clientId: string;
  barcode: string;
  scannedAt: string;
  longitude: number | null;
  latitude: number | null;
  voiceNoteUri: string | null;
  voiceNoteSynced: number;
  synced: number;
  capturedByUserId: string | null;
}

export function getPendingScans(capturedByUserId: string) {
  return db.getAllSync<PendingScan>(
    "SELECT * FROM pending_scans WHERE synced = 0 AND capturedByUserId = ?",
    capturedByUserId,
  );
}

/** Most recent scans captured by this user (regardless of sync state), for the home screen's review list. */
export function getRecentScans(capturedByUserId: string, limit: number) {
  return db.getAllSync<PendingScan>(
    "SELECT * FROM pending_scans WHERE capturedByUserId = ? ORDER BY scannedAt DESC LIMIT ?",
    capturedByUserId,
    limit,
  );
}

export function markScanSynced(id: number) {
  db.runSync("UPDATE pending_scans SET synced = 1 WHERE id = ?", id);
}

/** Voice notes only upload once their scan's metadata has synced (the server needs the ScanEvent row to exist first). */
export function getPendingVoiceNotes(capturedByUserId: string) {
  return db.getAllSync<PendingScan>(
    "SELECT * FROM pending_scans WHERE voiceNoteUri IS NOT NULL AND voiceNoteSynced = 0 AND synced = 1 AND capturedByUserId = ?",
    capturedByUserId,
  );
}

export function markVoiceNoteSynced(id: number) {
  db.runSync("UPDATE pending_scans SET voiceNoteSynced = 1 WHERE id = ?", id);
}
