import { CameraView, useCameraPermissions } from "expo-camera";
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { attachVoiceNote, queueScan } from "../lib/database";
import { getCurrentGeoPoint } from "../lib/location";
import { syncPendingScans, type SyncStatus } from "../lib/sync";
import type { FieldUser } from "../lib/auth";

const SYNC_INTERVAL_MS = 20_000;

interface Props {
  onBack: () => void;
  user: FieldUser;
}

export function ScannerScreen({ onBack, user }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const [lastScanId, setLastScanId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: "success",
    syncedCount: 0,
    voiceNotesUploaded: 0,
    voiceNotesFailed: 0,
    at: new Date(),
  });
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: "document" });

  const runSync = useRef(async () => {
    setSyncStatus(await syncPendingScans(user.id));
  });

  useEffect(() => {
    void runSync.current();
    const interval = setInterval(() => void runSync.current(), SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Camera access is needed to scan asset barcodes.
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  async function handleBarcodeScanned(data: string) {
    if (data === lastBarcode) return;
    setLastBarcode(data);

    const location = await getCurrentGeoPoint();
    const scanId = queueScan(
      {
        barcode: data,
        scannedAt: new Date().toISOString(),
        location: location ?? undefined,
      },
      user.id,
    );
    setLastScanId(scanId);
    void runSync.current();
  }

  async function startVoiceNote() {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) return;

    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
  }

  async function stopVoiceNote() {
    await recorder.stop();
    setIsRecording(false);
    if (recorder.uri && lastScanId != null) {
      attachVoiceNote(lastScanId, recorder.uri);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "code128", "code39"],
        }}
        onBarcodeScanned={({ data }) => {
          void handleBarcodeScanned(data);
        }}
      />
      <View style={styles.footer}>
        {lastBarcode ? (
          <>
            <Text style={styles.message}>Queued scan: {lastBarcode}</Text>
            <Button
              onPress={isRecording ? stopVoiceNote : startVoiceNote}
              title={isRecording ? "Stop voice note" : "Add voice note"}
            />
          </>
        ) : null}
        <Text style={styles.syncStatus}>{describeSyncStatus(syncStatus)}</Text>
        <Button onPress={() => void runSync.current()} title="Sync now" />
        <View style={styles.backButtonWrap}>
          <Button onPress={onBack} title="Back to home" />
        </View>
      </View>
    </View>
  );
}

function describeSyncStatus(status: SyncStatus): string {
  switch (status.state) {
    case "syncing":
      return "Syncing…";
    case "success": {
      const parts = [];
      if (status.syncedCount > 0) parts.push(`${status.syncedCount} scan(s)`);
      if (status.voiceNotesUploaded > 0) parts.push(`${status.voiceNotesUploaded} voice note(s)`);
      const summary =
        parts.length > 0
          ? `Synced ${parts.join(", ")} at ${status.at.toLocaleTimeString()}`
          : `Up to date as of ${status.at.toLocaleTimeString()}`;
      return status.voiceNotesFailed > 0
        ? `${status.voiceNotesFailed} voice note(s) failed to upload — will retry. ${summary}`
        : summary;
    }
    case "error":
      return `Sync failed (${status.message}) — will retry`;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  footer: {
    padding: 8,
  },
  message: {
    padding: 16,
    color: "#fff",
    textAlign: "center",
  },
  syncStatus: {
    padding: 4,
    color: "#9cf",
    textAlign: "center",
    fontSize: 12,
  },
  backButtonWrap: {
    marginTop: 8,
  },
});
