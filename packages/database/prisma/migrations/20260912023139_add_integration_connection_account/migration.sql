-- AlterTable
ALTER TABLE "integration_connections" ADD COLUMN     "accountId" TEXT;

-- CreateIndex
CREATE INDEX "integration_connections_accountId_idx" ON "integration_connections"("accountId");

-- AddForeignKey
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
