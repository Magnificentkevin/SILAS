# syntax=docker/dockerfile:1
FROM node:24-slim AS base
# Needed both when the query engine is generated (installer stage) and at
# runtime (runner stage) — Prisma detects libssl at each point independently.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS pruner
WORKDIR /repo
COPY . .
RUN npx --yes turbo@2.10.12 prune api --docker

FROM base AS installer
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
COPY --from=pruner /repo/out/package-lock.json ./package-lock.json
# --ignore-scripts: @repo/database's postinstall runs `prisma generate`, which needs
# schema.prisma — not present yet at this stage (only package.json manifests are).
# It's regenerated for real below, once the full source is copied in.
RUN npm install --ignore-scripts

COPY --from=pruner /repo/out/full/ .

# prisma generate (run as part of @repo/database's build) needs a syntactically
# valid DATABASE_URL at build time; the real value is injected at runtime.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
RUN npx turbo run build --filter=api

FROM base AS runner
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=installer /repo .

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
