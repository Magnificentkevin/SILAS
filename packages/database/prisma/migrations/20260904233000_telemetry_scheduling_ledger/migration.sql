-- CreateEnum
CREATE TYPE "ScheduleLockStatus" AS ENUM ('PENDING', 'LOCKED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PostingDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "facility_geofences" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "polygonGeoJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facility_geofences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facility_geofences_facilityId_key" ON "facility_geofences"("facilityId");

-- CreateTable
CREATE TABLE "telemetry_pings" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "isInsideGeofence" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_pings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "telemetry_pings_facilityId_idx" ON "telemetry_pings"("facilityId");

-- CreateTable
CREATE TABLE "schedule_locks" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "status" "ScheduleLockStatus" NOT NULL DEFAULT 'PENDING',
    "robotSocOk" BOOLEAN NOT NULL,
    "materialsAllocatedOk" BOOLEAN NOT NULL,
    "quietHourClearanceOk" BOOLEAN NOT NULL,
    "subcontractorComplianceOk" BOOLEAN NOT NULL,
    "escrowPreauthOk" BOOLEAN NOT NULL,
    "encryptedAccessPin" TEXT,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_locks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_locks_facilityId_idx" ON "schedule_locks"("facilityId");

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_postings" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "ledgerAccountId" TEXT NOT NULL,
    "direction" "PostingDirection" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_postings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ledger_postings_journalEntryId_idx" ON "ledger_postings"("journalEntryId");

-- CreateIndex
CREATE INDEX "ledger_postings_ledgerAccountId_idx" ON "ledger_postings"("ledgerAccountId");

-- AddForeignKey
ALTER TABLE "facility_geofences" ADD CONSTRAINT "facility_geofences_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_pings" ADD CONSTRAINT "telemetry_pings_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_locks" ADD CONSTRAINT "schedule_locks_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_postings" ADD CONSTRAINT "ledger_postings_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_postings" ADD CONSTRAINT "ledger_postings_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
