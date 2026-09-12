-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis_tiger_geocoder";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- CreateEnum
CREATE TYPE "IntegrationCategory" AS ENUM ('FACILITY_MANAGEMENT', 'EMPLOYEE_MANAGEMENT', 'PROJECT_MANAGEMENT', 'PLATFORM');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'ERROR', 'REVOKED');

-- CreateTable
CREATE TABLE "integration_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "IntegrationCategory" NOT NULL,
    "bestFor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_connections" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "scopes" TEXT[],
    "encryptedCredential" TEXT NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_providers_name_key" ON "integration_providers"("name");

-- CreateIndex
CREATE INDEX "integration_providers_category_idx" ON "integration_providers"("category");

-- CreateIndex
CREATE INDEX "integration_connections_providerId_idx" ON "integration_connections"("providerId");

-- CreateIndex
CREATE INDEX "integration_connections_status_idx" ON "integration_connections"("status");

-- AddForeignKey
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "integration_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
