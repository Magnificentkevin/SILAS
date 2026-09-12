import { z } from "zod";
import { GeoPointSchema } from "./geo.js";

export const AssetSchema = z.object({
  id: z.uuid(),
  barcode: z.string().min(1),
  name: z.string().min(1),
  location: GeoPointSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Asset = z.infer<typeof AssetSchema>;

export const CreateAssetSchema = AssetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateAsset = z.infer<typeof CreateAssetSchema>;

export const ScanAssetSchema = z.object({
  barcode: z.string().min(1),
  scannedAt: z.iso.datetime(),
  location: GeoPointSchema.optional(),
});
export type ScanAsset = z.infer<typeof ScanAssetSchema>;
