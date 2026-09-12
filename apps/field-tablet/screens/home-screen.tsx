import { useCallback, useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { getRecentScans, type PendingScan } from "../lib/database";
import { signOut, type FieldUser } from "../lib/auth";
import { syncPendingScans, type SyncStatus } from "../lib/sync";

const RECENT_SCAN_LIMIT = 25;

interface Props {
  user: FieldUser;
  onStartScanning: () => void;
  onSignedOut: () => void;
}

export function HomeScreen({ user, onStartScanning, onSignedOut }: Props) {
  const [scans, setScans] = useState<PendingScan[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: "success",
    syncedCount: 0,
    voiceNotesUploaded: 0,
    voiceNotesFailed: 0,
    at: new Date(),
  });

  const refresh = useCallback(() => {
    setScans(getRecentScans(user.id, RECENT_SCAN_LIMIT));
  }, [user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSync() {
    setSyncStatus(await syncPendingScans(user.id));
    refresh();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SILAS Field</Text>
          <Text style={styles.signedInAs}>Signed in as {user.email}</Text>
        </View>
        <Button
          title="Sign out"
          onPress={() => {
            void signOut().then(onSignedOut);
          }}
        />
      </View>

      <Text style={styles.syncStatus}>{describeSyncStatus(syncStatus)}</Text>
      <Button title="Sync now" onPress={() => void handleSync()} />

      <View style={styles.scanButtonWrap}>
        <Button title="Start scanning" onPress={onStartScanning} />
      </View>

      <Text style={styles.sectionTitle}>Recent scans</Text>
      <FlatList
        data={scans}
        keyExtractor={(item) => item.clientId}
        ListEmptyComponent={<Text style={styles.empty}>No scans yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.scanRow}>
            <Text style={styles.scanBarcode}>{item.barcode}</Text>
            <Text style={styles.scanMeta}>
              {new Date(item.scannedAt).toLocaleTimeString()} ·{" "}
              {item.synced ? "synced" : "pending"}
              {item.voiceNoteUri ? " · voice note" : ""}
            </Text>
          </View>
        )}
      />
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
      // A rejected upload never throws (it's a normal HTTP response, just
      // not .ok), so it can't reach the "error" branch below -- without this,
      // it would fall straight through to "Up to date" with no sign that a
      // recording is still sitting unsynced on the device.
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
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  signedInAs: {
    color: "#9cf",
    fontSize: 12,
    marginTop: 2,
  },
  syncStatus: {
    color: "#9cf",
    fontSize: 12,
    marginBottom: 8,
  },
  scanButtonWrap: {
    marginVertical: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  empty: {
    color: "#666",
    fontStyle: "italic",
  },
  scanRow: {
    paddingVertical: 8,
    borderBottomColor: "#222",
    borderBottomWidth: 1,
  },
  scanBarcode: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scanMeta: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
});
