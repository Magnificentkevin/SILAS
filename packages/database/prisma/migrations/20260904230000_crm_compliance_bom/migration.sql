-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BREACH_RECOVERY');

-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONTRACT_SIGNED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isHealthcareSite" BOOLEAN NOT NULL DEFAULT false,
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runs" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "runs_accountId_idx" ON "runs"("accountId");

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "stage" "OpportunityStage" NOT NULL DEFAULT 'PROSPECT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunities_accountId_idx" ON "opportunities"("accountId");

-- CreateTable
CREATE TABLE "baa_acceptances" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "digestSha256" TEXT NOT NULL,
    "acceptedBy" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baa_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "baa_acceptances_accountId_idx" ON "baa_acceptances"("accountId");

-- CreateTable
CREATE TABLE "inflation_index_logs" (
    "id" TEXT NOT NULL,
    "seriesCode" TEXT NOT NULL,
    "multiplier" DECIMAL(10,4) NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inflation_index_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inflation_index_logs_seriesCode_effectiveAt_idx" ON "inflation_index_logs"("seriesCode", "effectiveAt");

-- AddForeignKey
ALTER TABLE "runs" ADD CONSTRAINT "runs_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baa_acceptances" ADD CONSTRAINT "baa_acceptances_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
