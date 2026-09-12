-- Enable PostGIS before any geometry columns are created
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" geometry(Point, 4326) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assets_barcode_key" ON "assets"("barcode");

CREATE INDEX "assets_location_idx" ON "assets" USING GIST ("location");
