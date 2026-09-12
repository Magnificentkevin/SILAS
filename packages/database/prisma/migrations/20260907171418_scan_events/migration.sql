-- CreateTable
CREATE TABLE "scan_events" (
    "id" TEXT NOT NULL,
    "clientScanId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL,
    "location" geometry(Point, 4326),
    "voiceNoteUri" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scan_events_clientScanId_key" ON "scan_events"("clientScanId");

-- CreateIndex
CREATE INDEX "scan_events_barcode_idx" ON "scan_events"("barcode");
