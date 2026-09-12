import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { AssetSchema, CreateAssetSchema, ScanAssetSchema } from "./schemas/asset.js";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.register("Asset", AssetSchema);
registry.register("CreateAsset", CreateAssetSchema);
registry.register("ScanAsset", ScanAssetSchema);

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Silas API",
      version: "0.0.0",
    },
  });
}
