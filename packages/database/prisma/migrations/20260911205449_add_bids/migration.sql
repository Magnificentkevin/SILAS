-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT,
    "status" "BidStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bids_accountId_idx" ON "bids"("accountId");

-- CreateIndex
CREATE INDEX "bids_vendorId_idx" ON "bids"("vendorId");

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
