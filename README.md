# SILAS

A distributed orchestration platform for coordinating stateful operations across
heterogeneous enterprise systems — isolated client-side context, deterministic
Saga-based recovery, finite-resource leasing, and a cryptographically verifiable
audit chain. **All Business Cleaning** is the first real-world embodiment used to
prove the platform.

This is a Turborepo/npm-workspaces monorepo. All apps talk to one PostgreSQL
database and one NestJS API.

## Apps

| App | Path | Port | What it is |
|---|---|---|---|
| `api` | `apps/api` | `3000` | NestJS + Fastify backend. Everything else talks to this. |
| `web-client` | `apps/web-client` | `3001` | "SILAS Command Portal" — the internal ops dashboard (CRM pipeline, digital twin, five-point lock, pricing estimator). **Staff-only** (`ADMIN`/`OPERATOR`/`VERIFIER`), meant to live at `portal.silaserv.com` now that `silas-site` owns the root domain. |
| `staff-console` | `apps/staff-console` | `3002` | Dedicated staff login surface, meant to live at a separate subdomain (`staff.silaserv.com`). |
| `marketing-site` | `apps/marketing-site` | `3003` | Public site for **All Business Cleaning** (`allbusinesscleaning.com`) — home/services/about/contact, with a quote-request form that emails via `@repo/email`. Replaces the old HostGator/WordPress site. |
| `silas-site` | `apps/silas-site` | `3004` | Public product-preview site for **SILAS** itself, at `silaserv.com` — what the platform is, its core mechanisms, a "Staff Login" CTA to `web-client`/`staff-console`. |
| `algorhyme-site` | `apps/algorhyme-site` | `3005` | "Coming soon" landing page at `algorhymeofficial.com` — one CTA linking to `allbusinesscleaning.com`. |
| `client-portal` | `apps/client-portal` | `3006` | "SILAS Client Portal" — public-facing web app for vendors, customers, and host-client facilities (`VENDOR`/`CUSTOMER`/`HOST_CLIENT` account roles), meant to live at `clients.silaserv.com`. First slice covers exactly the three account-scoped actions the API currently exposes: submit a bid (vendor), accept a BAA (customer), attempt the five-point lock (host-client). Linked from `silas-site`'s "Client Login" CTA. |
| `field-tablet` | `apps/field-tablet` | Expo/Metro `8081` | React Native (Expo) app for field barcode scanning, GPS tagging, voice notes, and offline-first sync back to the API. Login (JWT via `expo-secure-store`, the OS keychain) gates a home screen (recent scans, sync status) before the scanner. Scans are attributed to the signed-in user server-side (`ScanEvent.scannedByUserId`). |

**Three separate public sites, linking one way only:** `algorhymeofficial.com` links to
`allbusinesscleaning.com`, which in turn links to `silaserv.com` ("Powered by
SILAS"). Nothing links back up the chain — `silaserv.com` doesn't link to
either of the others, and `allbusinesscleaning.com` doesn't link to
`algorhymeofficial.com`.

## Packages

| Package | What it is |
|---|---|
| `packages/database` | Prisma schema, migrations, and seed data. PostgreSQL via Docker. |
| `packages/contracts` | Shared Zod schemas used by both API and clients. |
| `packages/silas-core` | The actual invention primitives — `LeaseService` (finite-resource arbitration), `SagaEngine` (deterministic inverse recovery), `AuditVault` (hash-chained audit log), `CredentialCipher`, `AdapterPort`. Framework-agnostic, no NestJS/Prisma dependency. |
| `packages/email` | Transactional email — Resend client, React Email templates, and `sendQuoteRequestEmails()` used by `marketing-site`'s contact form. Needs `RESEND_API_KEY` and a verified sending domain in Resend. |
| `packages/eslint-config`, `packages/typescript-config` | Shared lint/tsconfig bases. |

## Prerequisites

- Node.js 24+
- npm
- Docker Desktop (for local PostgreSQL)
- For `field-tablet`: the [Expo Go](https://expo.dev/go) app on a physical device, or an emulator

## First-time setup

```bash
# 1. Install all workspace dependencies
npm install

# 2. Start PostgreSQL
docker compose up -d postgres

# 3. Configure environment variables (see reference below)
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env
# then edit apps/api/.env and fill in the generated secrets

# 4. Apply migrations and seed reference data (integration provider catalog, ledger accounts, SKUs)
cd packages/database
npx prisma migrate dev
npx prisma db seed
cd ../..
```

## Running things

Each app binds to Next.js's default port unless told otherwise, so **don't run
a blind `npm run dev` from the root** — `web-client` and `staff-console` would
both try to claim port 3000 and collide with the API. Run what you need,
explicitly:

```bash
# API — from apps/api
npm run start:dev              # http://localhost:3000 (watches for changes)

# web-client — from apps/web-client
npx next dev -p 3001           # http://localhost:3001

# staff-console — from apps/staff-console
npx next dev -p 3002           # http://localhost:3002

# marketing-site — from apps/marketing-site
npx next dev -p 3003           # http://localhost:3003

# silas-site — from apps/silas-site
npx next dev -p 3004           # http://localhost:3004

# algorhyme-site — from apps/algorhyme-site
npx next dev -p 3005           # http://localhost:3005

# client-portal — from apps/client-portal
npx next dev -p 3006           # http://localhost:3006

# field-tablet — from apps/field-tablet
npx expo start                 # then scan the QR with Expo Go, or press a/i for an emulator
```

## Auth model

Two independent things determine what a logged-in user can do — see
`apps/api/src/modules/auth`:

- **`globalRole`** (`ADMIN` / `OPERATOR` / `VERIFIER` / `null`) — internal SILAS
  staff, not scoped to any account. `ADMIN` bypasses all route checks.
- **`AccountMembership`** rows (`VENDOR` / `CUSTOMER` / `HOST_CLIENT`, each tied
  to exactly one `accountId`) — external parties, scoped to only the account(s)
  they belong to. `RolesGuard` (`apps/api/src/modules/auth/roles.guard.ts`)
  enforces this on every guarded route.

`POST /auth/register` never grants `globalRole` — there is no self-service path
to staff access. To create your first admin locally:

```bash
# 1. Register normally via POST /auth/register
# 2. Then promote that user directly in Postgres:
docker exec silas-postgres psql -U silas_admin -d silas_db \
  -c "UPDATE users SET \"globalRole\" = 'ADMIN' WHERE email = 'you@example.com';"
```

`web-client` and `staff-console` both call the same `/auth/login` endpoint;
each frontend independently rejects a login whose `globalRole` doesn't match
what that surface expects (see `lib/auth.ts` in each app).

## Environment variables

| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | `apps/api/.env`, `packages/database/.env` | Matches `docker-compose.yml`'s `postgres` service by default. |
| `SCHEDULE_LOCK_ENCRYPTION_KEY` | `apps/api/.env` | 32-byte hex key (AES-256-GCM) for the five-point lock's access PIN. |
| `INTEGRATION_CREDENTIAL_KEY` | `apps/api/.env` | 32-byte hex key for sealing third-party integration credentials at rest. |
| `JWT_SECRET` | `apps/api/.env` | Random secret for signing auth tokens. |
| `JWT_EXPIRES_IN` | `apps/api/.env` | Defaults to `8h`. |
| `EXPO_PUBLIC_API_URL` | `apps/field-tablet/.env` | Where the mobile app reaches the API — `http://localhost:3000` works over USB with `adb reverse tcp:3000 tcp:3000`; use your machine's LAN IP for Wi-Fi (and make sure the network is set to **Private** in Windows, not Public, or the firewall blocks it). |
| `NEXT_PUBLIC_API_URL` | `apps/web-client`, `apps/staff-console`, `apps/client-portal` | Defaults to `http://localhost:3000` if unset. |
| `RESEND_API_KEY` | `apps/marketing-site/.env` | From [resend.com/api-keys](https://resend.com/api-keys). The sending domain (`allbusinesscleaning.com`) must be verified in Resend first (Domains → Add Domain → add the DNS records at your DNS host). |
| `NEXT_PUBLIC_SITE_URL` | `apps/marketing-site/.env` | Defaults to `https://allbusinesscleaning.com` if unset. |
| `NEXT_PUBLIC_APP_URL` | `apps/web-client/.env.local` | Defaults to `https://portal.silaserv.com` if unset — used for `metadataBase`, not API calls. |
| `NEXT_PUBLIC_PORTAL_URL` | `apps/silas-site/.env` | Where the "Staff Login" button on `silas-site` points. Defaults to `https://portal.silaserv.com` if unset. |
| `NEXT_PUBLIC_CLIENT_PORTAL_URL` | `apps/silas-site/.env` | Where the "Client Login" button on `silas-site` points. Defaults to `https://clients.silaserv.com` if unset. |
| `NEXT_PUBLIC_SITE_URL` | `apps/client-portal/.env` | Defaults to `https://clients.silaserv.com` if unset. |

Generate any hex key or secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Never commit a real `.env` file.** Only `.env.example` files (placeholders,
no real secrets) belong in git — the root `.gitignore` already excludes `.env`.

## Testing

Each package/app with tests uses Vitest:

```bash
cd apps/api && npm test
cd packages/silas-core && npm test
```

## Repo layout

```
apps/
  api/              NestJS backend
  web-client/       Internal ops dashboard (portal.silaserv.com, staff-only)
  staff-console/    Staff login surface (staff.silaserv.com)
  marketing-site/   Public allbusinesscleaning.com site + quote-request form
  silas-site/       Public silaserv.com product-preview site
  algorhyme-site/   algorhymeofficial.com link-in-bio page
  field-tablet/     Expo mobile app
packages/
  database/         Prisma schema + migrations + seed
  contracts/        Shared Zod schemas
  silas-core/       The invention primitives (lease, saga, audit, crypto)
  email/            Resend client + React Email templates
  eslint-config/
  typescript-config/
```
