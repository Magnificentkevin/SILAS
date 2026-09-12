import { z } from "zod";

export const GeoPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number(), z.number()]),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;
