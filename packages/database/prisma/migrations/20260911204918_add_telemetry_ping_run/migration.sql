-- AlterTable
ALTER TABLE "telemetry_pings" ADD COLUMN "runId" TEXT;

-- CreateIndex
CREATE INDEX "telemetry_pings_runId_idx" ON "telemetry_pings"("runId");

-- AddForeignKey
ALTER TABLE "telemetry_pings" ADD CONSTRAINT "telemetry_pings_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
