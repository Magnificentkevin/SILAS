import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildOpenApiDocument } from "./openapi.js";

const outPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../openapi.json",
);

writeFileSync(outPath, JSON.stringify(buildOpenApiDocument(), null, 2));
console.log(`Wrote ${outPath}`);
