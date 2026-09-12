-- AlterTable
ALTER TABLE "scan_events" ADD COLUMN     "scannedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "scan_events_scannedByUserId_idx" ON "scan_events"("scannedByUserId");

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_scannedByUserId_fkey" FOREIGN KEY ("scannedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
