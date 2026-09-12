import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';
import type { Asset, CreateAsset } from '@repo/contracts';

type AssetRow = {
  id: string;
  barcode: string;
  name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
};

function toAsset(row: AssetRow): Asset {
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    location: JSON.parse(row.location),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class AssetsService {
  async findAll(): Promise<Asset[]> {
    const rows = await prisma.$queryRaw<AssetRow[]>`
      SELECT id, barcode, name, "createdAt", "updatedAt", ST_AsGeoJSON(location) as location
      FROM assets
      ORDER BY "createdAt" DESC
    `;
    return rows.map(toAsset);
  }

  async create(asset: CreateAsset): Promise<Asset> {
    const [lng, lat] = asset.location.coordinates;
    const [row] = await prisma.$queryRaw<AssetRow[]>`
      INSERT INTO assets (id, barcode, name, location, "updatedAt")
      VALUES (
        gen_random_uuid(),
        ${asset.barcode},
        ${asset.name},
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        now()
      )
      RETURNING id, barcode, name, "createdAt", "updatedAt", ST_AsGeoJSON(location) as location
    `;
    if (!row) {
      throw new Error('Failed to create asset');
    }
    return toAsset(row);
  }
}
