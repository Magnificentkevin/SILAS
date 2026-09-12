-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN "settlementKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_settlementKey_key" ON "journal_entries"("settlementKey");
