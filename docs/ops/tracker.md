# SILAS Tracker

**Purpose:** one place to see what this project is waiting on, what's
blocking launch, and what's been deliberately deferred — so re-entering
this project after a gap doesn't mean re-deriving all of it from memory.
Keep entries to one line. Update as things change; don't let this grow
into a second status doc — `docs/patent/04-prototype-status.md` already
owns the detailed patent-track evidence.

## Next up (2026-09-13)

- **In progress:** SILAS rebrand rollout (robot mascot badge, gradient
  wordmark, "Consider it handled." tagline, official palette) across
  `silas-site`, `staff-console`/`client-portal`/`web-client`, and
  `field-tablet`. Plan reviewed with `ux-ui-designer`/`cmo` first — see
  the dedicated entry below once it lands. This *is* the UI/UX pass
  named below, now that real brand assets exist to do it with.
- field-tablet is the one surface already judged well-designed (see
  the UX/UI audit lane) independent of the rebrand.
- **Parked:** publish `field-tablet` to the App Store / Play Store, then
  add real download links (Android/iOS/desktop) to the main marketing
  page. Not started — `app.json` has no `bundleIdentifier`/`package`
  set yet, and there's no Apple Developer or Google Play Console
  account connected. Needs Kevin to create/fund those accounts (account
  creation and payment aren't things Claude can do on his behalf)
  before EAS build + submission can happen. No "desktop" product
  exists in this repo at all — client-portal/staff-console/web-client
  are browser apps; a desktop download would mean either an Electron/
  Tauri wrapper (new work) or just calling the installable-PWA route
  "desktop," which is a much smaller ask than native app store
  publishing — worth deciding which when this is picked back up.

## Password reset + plain-language errors — done (2026-09-13)

Scoped with Kevin first: email reset link for the three web apps
(client-portal, staff-console, web-client) only; field-tablet keeps
relying on a staff-triggered reset for now — no email step in its
login flow, and this was the smallest correct scope for today.

**Backend**: new `PasswordResetToken` table, migration
`20260913162934_add_password_reset_token` — a brand-new table, so
unlike the `IntegrationConnection.accountId` migration there's no
existing-rows/backfill concern at all.
`POST /auth/forgot-password` (`{email, app}` — `app` is a fixed enum
the server maps to its own configured base URL, never a client-supplied
URL — accepting one would let a phishing page get a legitimate reset
token pointed at itself just by asking) always returns the same
`{ok:true}` regardless of whether the email matches an account, and
never throws even if the email provider itself fails — both are
deliberate anti-enumeration properties, not oversights.
`POST /auth/reset-password` (`{token, newPassword}`) validates the
token (unknown/expired/already-used all rejected identically),
updates the password and marks the token used in one transaction.
Both endpoints `@SkipCsrf()`, same reasoning as login/register: no
session exists yet at the point of calling them. New
`sendPasswordResetEmail` + template added to `@repo/email`, reusing
the existing Resend integration `marketing-site` already uses.
8 new `auth.service.spec.ts` tests.
**Live-verified end to end against real local Postgres** — not just
mocked: real registration, real `forgot-password` call confirmed to
create a real `PasswordResetToken` row, a wrong token rejected (400),
a correct token accepted, the same token rejected on reuse (400), and
— the part that actually proves it worked — login with the *old*
password now fails (401) while login with the *new* one succeeds
(201). `RESEND_API_KEY` isn't configured locally, so the actual email
send was exercised as far as it honestly could be (confirmed the
failure is caught, not thrown) — sending a real email needs
`RESEND_API_KEY` set, which is a decision for whoever owns that
account, not assumed here.

**Plain-language errors**: added a `describeError()` helper to all
four apps' `lib/api.ts` (parses NestJS's `{message, error, statusCode}`
shape out of `apiFetch`'s deliberately technical error string, falls
back to a generic message otherwise) and wired it into every spot that
was previously showing a raw error to the user: all four login screens,
client-portal's BAA/bid/lock pages, web-client's five-point-lock-panel
and post-bid-estimator, and field-tablet's sync-status line.

**Deployed 2026-09-13**: migration applied to production Cloud SQL via
the usual Auth Proxy tunnel; new image built (`gcloud builds submit`)
and rolled out to Cloud Run (revision `silas-api-00010-mv9`). Verified
live: `/health` returns `{"status":"ok","database":"connected"}` and a
real `POST /auth/forgot-password` against the new revision returns
`{"ok":true}`. `CLIENT_PORTAL_URL` set on the Cloud Run service to the
real live URL (`https://client-portal-taupe-two.vercel.app` — note
this changed from the URL recorded in the "Launch blockers" section
below, confirming the CORS-fix entry's point about deployment URLs not
being stable). Two things deliberately **not** done, both real open
decisions rather than oversights:
- `RESEND_API_KEY` / `PASSWORD_RESET_EMAIL_FROM` are still unset in
  production — same as local, `forgotPassword` catches the send
  failure rather than throwing, so the API behaves correctly but no
  email actually goes out yet. Needs a real Resend key from whoever
  owns that account before reset emails can send for real; setting one
  means the feature starts emailing real people, so it wasn't done
  without asking first.
- `STAFF_CONSOLE_URL` / `WEB_CLIENT_URL` were **not** set to anything,
  because — checked via `vercel projects ls` — `staff-console` and
  `web-client` were never actually deployed; only `client-portal` is
  live. Password reset for those two apps is scoped and coded but has
  nowhere real to send a link until they're deployed.

## Waiting on

- Reply from Washington Patent Services — outreach letter sent (see
  `docs/legal/counsel-outreach-draft.md`), awaiting response as of
  2026-09-09.

## Launch blockers

- ~~`client-portal` has no hosting/deployment credentials~~ **Live as of
  2026-09-10:** deployed to Vercel (project `client-portal` under account
  `kevincomeau79-9646`, GitHub-connected for auto-deploy on push), joining
  the other Next.js apps there. `NEXT_PUBLIC_API_URL` points at the live
  Cloud Run backend. Default deployment protection (Vercel SSO) was on by
  default and made the site unreachable by real vendors/customers/host
  clients — disabled for this project since it's meant to be public.
  Verified live: `/` and `/login` both return 200 at
  `https://client-portal-mafd9r654-kevincomeau79-9646.vercel.app`. No
  custom domain attached yet.
  **Update 2026-09-13:** that URL is already gone — Vercel reassigned
  client-portal's production alias to `client-portal-taupe-two.vercel.app`
  with no action on our end, and the CORS allowlist (which had been
  hardened to match the account-scoped alias family after the last time
  this happened) still didn't match the new shape, so **client-portal
  login was silently broken in production** until caught today while
  wiring CORS for the two new app deployments below. Fixed by broadening
  the match to any `client-portal-*.vercel.app` rather than encoding any
  particular alias shape a second time (`apps/api/src/main.ts`). Verified
  live: an OPTIONS preflight from the real current origin now returns
  204 with the correct `access-control-allow-origin`. Lesson banked: this
  class of bug (Vercel alias drift silently breaking CORS) has now
  recurred twice — worth a periodic live check rather than assuming a
  fix holds forever.
- ~~`staff-console`/`web-client` have no hosting~~ **Live as of
  2026-09-13:** deployed to Vercel the same way as client-portal (Root
  Directory must be set to `apps/staff-console`/`apps/web-client` via the
  Vercel API — no CLI flag for it, same gotcha as the client-portal
  incident — then redeployed via a GitHub push, since CLI-triggered
  deploys don't respect a monorepo's Root Directory the same way).
  `NEXT_PUBLIC_API_URL` set on both; `STAFF_CONSOLE_URL`/`WEB_CLIENT_URL`
  set on the Cloud Run API so password-reset emails point at real URLs.
  Custom subdomains `staff.silaserv.com` / `app.silaserv.com` registered
  on the Vercel side and added to the CORS allowlist, but **DNS isn't
  live yet** — `silaserv.com` is hosted externally at HostGator, not on
  Vercel, so Kevin needs to add two CNAME records himself (Claude has no
  HostGator access): `staff.silaserv.com` → `cname.vercel-dns.com` and
  `app.silaserv.com` → `cname.vercel-dns.com`. Both apps are fully live
  and verified today at their Vercel-assigned URLs in the meantime.
- ~~Backend (`apps/api` + Postgres) has no production hosting~~ **Live as
  of 2026-09-10:** deployed to Cloud Run (`silas-api`, project
  `silas-507213`, region `us-central1`) + Cloud SQL for PostgreSQL
  (`silas-postgres`, POSTGRES_16, PostGIS-capable). All 8 local
  migrations applied to production via a local Cloud SQL Auth Proxy
  tunnel; `JWT_SECRET`/`INTEGRATION_CREDENTIAL_KEY` generated fresh for
  prod (not reused from local `.env`) and stored in Secret Manager
  alongside the pre-existing `DATABASE_URL`/`SCHEDULE_LOCK_ENCRYPTION_KEY`
  secrets. Verified end-to-end (health check + real `/auth/register`
  call) against revision `silas-api-00004-229`. Service URL:
  `https://silas-api-600222468229.us-central1.run.app`.
- ~~`field-tablet` has no real-device verification~~ **Verified 2026-09-10**
  on a real Android device via Expo Go (LAN mode; `EXPO_PUBLIC_API_URL`
  pointed at the live Cloud Run backend rather than `localhost`, which
  doesn't resolve from a physical phone). Full round trip confirmed: login
  → scan → sync, with the resulting `ScanEvent` row correctly attributed
  (`scannedByUserId` resolves to the logging-in user's email) via a direct
  production-database query. iOS Simulator remains impossible on this
  Windows dev machine; no Android emulator was needed since a physical
  device sufficed.
- This dev machine is resource-constrained (7.68 GB RAM, frequently under
  1 GB free even at idle) — expect NestJS `--watch` mode and Next.js dev
  servers to be unreliable; prefer one-shot builds (`npm run build` +
  `node dist/main.js`) over watch mode when verifying backend changes.

## In progress

- **httpOnly-cookie auth migration — complete, tested, and live-verified
  2026-09-11.** Kevin finished the `TODO(human)` CSRF-comparison logic in
  `csrf.guard.ts` himself (timing-safe comparison via `timingSafeEqual`).
  A full-team, twelve-role audit of the whole project then independently
  converged — seven separate reviewers, from completely different
  angles — on the same finding: as committed at that point, the CSRF
  guard had no exemption for `/auth/login`/`/auth/register`, so a fresh
  browser with no CSRF cookie yet could never get past the very first
  login/register request. That compounded with the already-known design
  bug (the CSRF cookie was host-only, unreadable by `client-portal`'s JS
  once cross-origin) into a total, unconditional outage of every
  cookie-based frontend the moment this shipped.
  Fixed by redesigning the CSRF token's delivery rather than patching
  around it: the token is now minted once at login/register and embedded
  as a `csrfToken` claim in the session JWT itself (`jwt-payload.ts`),
  delivered to the client in that response's JSON body — never a second
  cookie. `CsrfGuard` is now DI-managed (registered via `APP_GUARD` in
  `auth.module.ts`, not manually instantiated in `main.ts`) so it can
  inject `JwtService`/`Reflector`, verify the session JWT itself
  (it runs before any per-route `JwtAuthGuard` would populate
  `request.user`), and check a new `@SkipCsrf()` decorator (mirrors
  `@Roles()`) applied to `login`/`register`. All three web frontends'
  `lib/api.ts` read the token from `localStorage` (set once per login,
  cleared on sign-out) instead of `document.cookie`, since it no longer
  exists as a cookie at all. `csrf.guard.spec.ts` gained a regression
  test asserting the real `AuthController.login`/`.register` actually
  carry the `@SkipCsrf()` metadata — the exact class of gap ("guard
  logic correct in isolation, not verified against real route wiring")
  every reviewer flagged.
  Live-verified end to end against a real local Postgres, not just unit
  tests: fresh register with zero cookies → succeeds; fresh login with
  zero cookies → succeeds (both previously 403'd); a real mutating
  request (`POST /scans/sync`) with no CSRF header → 403; with the wrong
  header → 403; with the correct header → 201 and a real row persisted.
  CSRF protection is still genuinely enforced, not disabled. 64/64
  `apps/api` tests pass, `nest build` succeeds, `turbo run test` is
  7/7 across the monorepo.
  Two smaller, separately-confirmed findings from the same audit fixed
  alongside this: `POST /api/v1/telemetry/ping` and
  `POST /api/v1/telemetry/geofences` had no auth guard at all (anyone
  could post fake location pings or rewrite a facility's geofence) —
  both now require `JwtAuthGuard`.
  **Update 2026-09-12: the hardcoded-CORS-URL prediction came true and
  was fixed the same day** — see the "Repo migrated" entry below for
  the full story (client-portal redeployed under a new URL as a side
  effect of the repo move, and the old hardcoded origin was, as
  predicted, a frozen per-deployment snapshot that no longer matched
  anything real). `main.ts`'s CORS check is now a dynamic origin
  function matching the whole `client-portal-*-kevincomeau79-9646.vercel.app`
  family (stable alias and any hash-suffixed deployment/preview), not
  one hardcoded string. Verified live: a
  preflight from the real stable origin, from the new deployment's own
  hash URL, and from an untrusted origin all get the correct
  allow/deny response.
  Not yet addressed (lower severity, tracked not fixed): the CSRF token
  itself is a bare random value rather than HMAC-bound to the session
  per OWASP's stronger recommendation
  (defense-in-depth, not urgent absent a shared parent domain).
- **"Full team" audit, 2026-09-11** — a twelve-role review of the whole
  business (not just engineering: product, ops, marketing, sales,
  customer success, finance, UX, QA, devops, tech-PM, CTO, developer),
  triggered by an example construction-vertical walkthrough Kevin
  provided (a general contractor consultation → BOM estimate → proposal
  → material sourcing → subcontractor bidding → progress tracking →
  review flow) plus real example vendor/client/subcontractor data. Full
  findings are broad (see the board-report artifact from that session);
  the one item actually built and shipped from it:
  **`IntegrationConnection` account-scoping** — the "plug-in"
  mechanism the walkthrough describes (SILAS connecting to a vendor's
  existing software) had no `accountId` at all, confirmed against real
  industry practice (Procore/ServiceTitan's own OAuth-per-company
  pattern, general multi-tenant SaaS guidance: "a token valid for
  tenant A accepted against tenant B's resources is the single most
  dangerous failure in this space"). Not an active leak today — the
  whole module is staff-only (`@Roles('ADMIN','OPERATOR')`), so no
  external vendor/customer could reach it — but a real blocker for the
  walkthrough's own vision of each contractor managing their own
  integrations. Fixed: `IntegrationConnection.accountId` (nullable, for
  pre-existing rows), required on every new connection going forward
  (`CreateConnectionDto`), `listConnections` takes an optional
  `accountId` filter. Live-verified against real local Postgres with
  two connections on two different real accounts: filtering by account
  A returns only A's connection, filtering by B returns only B's, no
  filter returns both (staff's existing blanket-visibility model,
  unchanged). Also live-verified real cross-account isolation on the
  already-built `Bid` flow using the same real account data: a vendor
  with membership on account A can bid on A (201) but not B (403); a
  vendor with no membership anywhere is denied everywhere (403) — both
  confirmed with genuinely valid CSRF tokens, ruling out a false-positive
  from an unrelated failure. 68/68 `apps/api` tests pass (4 new),
  `turbo run test` 7/7, migration
  `20260912023139_add_integration_connection_account` applied locally
  and **now applied to production** (2026-09-11, via the same Cloud SQL
  Auth Proxy tunnel pattern).
  The rest of the walkthrough (BOM/estimate calculation for a second
  vertical, automated vendor/subcontractor sourcing and matching,
  customer/GC/subcontractor app views, review system) is the
  multi-month construction-vertical build `multi-tenant-design-v2.md`
  already scopes in detail, gated on step 5's own condition (a
  committed pilot customer or paid LOI) — deliberately not attempted in
  this pass rather than faking a rushed version of it.

- **Both fixes above deployed to production, 2026-09-11.** Migration
  `20260912023139_add_integration_connection_account` applied, then a
  fresh `silas-api` image built via `cloudbuild.yaml` and deployed to
  Cloud Run (revision `silas-api-00006-whk`). Confirmed serving traffic
  (`GET /auth/me` → 401 as expected for an unauthenticated request, not
  a crash/500). No production test accounts were created — verification
  before deploy was against real local Postgres only, per this
  project's standing rule about not writing synthetic data into prod.
  Also added while wrapping up this pass, small and low-risk:
  `GET /health` (real DB round-trip via `SELECT 1`, no auth — Cloud
  Run has no built-in app-level health check) and
  `app.enableShutdownHooks()` in `main.ts` (Cloud Run sends SIGTERM on
  scale-down/redeploy; without this, in-flight requests and the Prisma
  pool weren't draining cleanly). Both were findings from the DevOps
  audit lane. **Deployed 2026-09-12 (revision `silas-api-00007-d2f`),
  and immediately hit a real gotcha**: the endpoint was first named
  `/healthz`, which is a path Google's Front End intercepts and 404s
  before it ever reaches Cloud Run — confirmed via `curl` (a
  Google-branded error page, no `x-cloud-trace-context` header, unlike
  every other route) and cross-checked against other real projects that
  hit the same thing. Renamed to `/health`, redeployed
  (`silas-api-00008-zgh`), confirmed live: `GET /health` returns
  `{"status":"ok","database":"connected"}` with a real
  `x-cloud-trace-context` header (proof it reached the app, unlike the
  Google-branded 404 `/healthz` got). 70/70
  `apps/api` tests pass throughout.
  Also from the approved follow-up list: removed two premature
  "patent-pending" assertions (`docs/legal/terms-of-service.md`'s
  confidentiality-clause drafting note, `docs/legal/README.md`'s
  cross-reference) — no application has actually been filed yet, only
  an outreach letter awaiting reply. Added `docs/business/pricing.md`,
  a placeholder pricing note ($200/month per account) grounded against
  real 2026 market pricing for adjacent categories (small-business
  CMMS, Jobber, ServiceTitan) — explicitly not a finalized decision.
  Investigated the `AGENTS.md` files five separate audit agents flagged
  as a possible prompt-injection pattern: **false alarm** — verified
  directly against the installed `node_modules/next` source that this
  is genuine, sanctioned Next.js 16.3.4 tooling
  (`generate-agent-files.js`), not planted content.
  Still open from the approved list: a real deploy runbook/checklist
  doc, and password reset + plain-language error messages across all
  four apps (raw backend error strings currently reach end users) —
  intentionally not started tonight rather than left half-finished.
- **External security/correctness audit remediation** — a detailed
  external review (20 findings, R01–R20, plus 3 migration-specific
  W01–W03) landed 2026-09-11. R01 (registration could self-assign
  membership on any account by UUID, no invitation check) is fixed and
  verified — see `apps/api/src/modules/auth/auth.service.ts` +
  `apps/api/src/modules/crm/crm-pipeline.service.ts`'s new
  `grantMembership`. R02 (scan voice-note overwrite has no ownership
  check) is also fixed and verified 2026-09-11 — `attachVoiceNote` now
  requires the caller to be either the scan's original capturer or
  staff, with a real cross-user-denial test in the new
  `scans.service.spec.ts`. R03 (settlement retries could double-post to
  the ledger) is also fixed 2026-09-11 — `postSettlement` now requires a
  caller-supplied `settlementKey`, checked before posting and enforced by
  a DB-level unique constraint (`JournalEntry.settlementKey`) so a
  genuinely concurrent duplicate request returns the original posting
  instead of racing past an application-level check. Covered by
  `journal.service.spec.ts` (sequential retry, concurrent-duplicate race
  via a simulated unique-constraint violation, and non-constraint errors
  still propagate). **Docker was down all session** ("Docker Desktop is
  unable to start" — traced to 9 stale/duplicate Docker processes left
  from earlier failed starts plus genuine low free memory; fixed by
  killing them and relaunching cleanly). All three hand-written
  migrations from this remediation pass applied cleanly to a real local
  Postgres, and R03/R04/R06 were re-verified against that live database
  (not mocks) — idempotency, run-scoping, and bid persistence all
  confirmed working end-to-end. These same three migrations were
  applied to production 2026-09-11 via a Cloud SQL Auth Proxy tunnel
  (Kevin ran `prisma migrate deploy` himself after an agent's first
  attempt hit a real gotcha: a naive host/port regex rewrite of the
  production `DATABASE_URL` left its `?host=/cloudsql/...` query
  param in place, and that param overrides the URL's own host for
  Cloud SQL's Unix-socket connection style, so Prisma kept trying the
  unreachable socket path instead of the tunnel; fixed by parsing the
  URL properly and deleting that param before forcing `127.0.0.1:5433`).
  Confirmed applied: all three named above, cleanly, no errors. R04
  (stale telemetry
  validates unrelated new settlements) is also fixed 2026-09-11 —
  `FourWayMatchService.evaluateMatch` now requires a `runId`, verifies
  it belongs to the given facility, and scopes the telemetry-ping count
  to that specific run instead of the facility's entire history;
  `TelemetryPing` gained a nullable `runId` column
  (`20260911204918_add_telemetry_ping_run`, applied and live-verified —
  see R03's note above) and ping ingestion now requires one too. Covered by
  `four-way-match.service.spec.ts`, including the exact scenario the
  audit named (a prior run's pings must not satisfy a different run's
  settlement). **New finding surfaced while fixing this, not yet
  fixed:** `POST /api/v1/telemetry/ping` has no auth guard at all —
  `apps/api/src/modules/telemetry/telemetry.controller.ts` — anyone can
  currently post fake location pings for any facility/run. Out of scope
  for R04 specifically (a different bug in an adjacent endpoint), but
  real and worth its own fix.
  R06 (vendor bid submission returned success without persisting
  anything) is also fixed 2026-09-11 — added a real `Bid` model
  (`20260911205449_add_bids`, applied and live-verified — see R03's
  note above); `POST /compliance/bids` now persists the bid with `vendorId` taken
  from the authenticated caller (never client-supplied, same ownership
  principle as R02) and returns the real record with a real ID and
  status instead of an HTTP echo; added
  `GET /compliance/bids/:accountId` (ADMIN/OPERATOR only) for the staff
  retrieval the audit's recommended acceptance specifically called for.
  Covered by `bid.service.spec.ts`.
  R07 (tablet account-switching misattributed queued scans) is also
  fixed 2026-09-11 — `field-tablet`'s local `pending_scans` table
  (`apps/field-tablet/lib/database.ts`) gained a `capturedByUserId`
  column (self-migrating via a guarded `ALTER TABLE`, since devices
  that already had the app installed need the column added, not just
  created); `queueScan`, `getPendingScans`, `getRecentScans`, and
  `getPendingVoiceNotes` all now take the current user's ID and filter
  by it, and `syncPendingScans` threads that ID through the whole sync
  cycle. Fixes both halves the audit named: a different user's queued
  scans no longer upload under whoever's currently signed in, and the
  home screen's recent-scans list no longer shows another user's
  captures. `ScannerScreen` needed a new `user` prop (it had none
  before) to reach the current identity down to `queueScan`. **No
  automated test** — `field-tablet` has no test infrastructure at all
  (confirmed: no spec files, no vitest config), consistent with how it
  was verified earlier this session (a real Android device via Expo
  Go, not automated tests). Type-checks clean; still needs a real-
  device re-verification of the actual account-switching scenario
  (user A queues offline, signs out, user B signs in and syncs) before
  this is fully confirmed, matching the audit's own recommended test.
  R09 (stale facility lock result could be mistaken for a different
  facility's) is also fixed 2026-09-11 —
  `apps/web-client/components/five-point-lock-panel.tsx` now: resets
  `result`/`error` whenever `accountId` changes (a previous facility's
  outcome must never appear to belong to a newly-selected one); tracks
  the current `accountId` in a ref and checks it against the
  request's own snapshot before applying a response, so a request for
  facility A that resolves after the panel has already switched to
  facility B is silently discarded instead of being shown as B's
  result; and now displays `result.facilityId` on the result itself
  (the backend's `FivePointLockResult` already returned it — confirmed
  in `scheduling-lock.service.ts` — the frontend just wasn't rendering
  it). Type-checks clean. **Not yet end-to-end verified in a browser**
  — this component needs a live backend to genuinely exercise the
  switch-during-a-pending-request race. Docker is no longer the
  blocker (fixed — see R03's note above); `apps/api` now fails to
  build at all (`nest build` errors on the incomplete `csrf.guard.ts`
  `TODO(human)` — `tsc --noEmit`/`vitest` tolerate it, a real build
  doesn't), so this is blocked on Kevin's in-progress CSRF work, not
  on infrastructure. Verified by direct code reading only so far.
  R05 (revoked integrations could still dispatch) is also fixed
  2026-09-11 — `dispatch()` now requires `status === CONNECTED`
  (rejecting PENDING, ERROR, and REVOKED alike, not just REVOKED
  specifically), and `verifyConnection()` refuses to run at all on a
  REVOKED connection instead of silently reactivating it back to
  CONNECTED. Covered by `integrations.service.spec.ts` (parametrized
  rejection across all three non-CONNECTED statuses, plus the CONNECTED
  happy path) and additionally live-verified against real Postgres:
  create → verify → revoke → confirmed both dispatch and re-verify
  reject, and the connection's status in the database stays REVOKED
  throughout, not silently reactivated.
  R08 (voice notes stored on ephemeral Cloud Run disk, not durable
  storage) is also fixed 2026-09-11 — two real problems, both matching
  the audit's "durable... authorized retrieval" language: local
  container disk doesn't survive a redeploy, and doesn't work at all
  across `silas-api`'s `maxScale: 2` concurrent instances (each has its
  own disk); and retrieval was via a fully unauthenticated public
  `@fastify/static` path with no auth guard at all. Added
  `VoiceNoteStorageService` (`apps/api/src/modules/scans/voice-note-storage.service.ts`)
  wrapping GCS with a deterministic per-scan object key and 15-minute
  signed download URLs; `attachVoiceNote` now uploads there instead of
  local disk, and a new `GET /scans/:clientScanId/voice-note` issues
  the signed URL after the same ownership check as R02
  (`assertCanAccessScan` — capturer or staff only), replacing the old
  public static path (`main.ts`'s `fastifyStatic` registration and
  `uploads.ts` both removed, `@fastify/static` uninstalled). Covered by
  `voice-note-storage.service.spec.ts` (upload success/failure, signed
  URL expiry window, missing-bucket-env-var guard) and an updated
  `scans.service.spec.ts` (ownership check now also covers the new
  retrieval endpoint: owner, staff, non-owner denial, no-recording-yet
  404, unknown-scan 404). Live infrastructure provisioned in
  `silas-507213`: bucket `silas-507213-voice-notes` (`us-central1`,
  uniform bucket-level access, no public access), `silas-api`'s Cloud
  Run service account granted `roles/storage.objectAdmin` scoped to
  just that bucket, and `VOICE_NOTES_BUCKET` set both on the Cloud Run
  service and locally in `apps/api/.env`. **Not yet deployed** — the
  Cloud Run env-var update rolled a new revision of the *existing*
  container image; the actual R08 code changes still need a fresh
  image build/deploy before production is actually storing voice notes
  durably.
  R10 (failed voice uploads can still show "Up to date") is also fixed
  2026-09-11 — `field-tablet`'s `syncVoiceNotes`
  (`apps/field-tablet/lib/sync.ts`) had an `if (res.ok)` with no `else`:
  a rejected upload (bad file type, size limit, a transient 5xx — none
  of which throw, since `fetch` resolves normally on a non-2xx
  response) was silently skipped. The local row correctly stayed
  `voiceNoteSynced = 0` so it would retry next cycle, but the sync
  cycle itself reported `voiceNotesUploaded: 0` with no other signal,
  and `describeSyncStatus` (duplicated in both `home-screen.tsx` and
  `scanner-screen.tsx`) falls back to "Up to date" whenever both
  counts are zero — exactly the audit's scenario: a real failure
  displayed as if nothing were pending. `syncVoiceNotes` now returns
  `{ uploaded, failed }`, threaded through a new `voiceNotesFailed`
  field on `SyncStatus`'s success variant; both screens' status text
  now leads with `"N voice note(s) failed to upload — will retry"`
  whenever `voiceNotesFailed > 0`, instead of masking it. Type-checks
  clean. **No automated test** — same as R07, `field-tablet` has no
  test infrastructure at all; still needs real-device verification of
  the actual failure path (e.g. force a 4xx by uploading an
  unsupported file type) before this is fully confirmed.
  R11 (BAA acceptance has no reviewable terms/version) is also fixed
  2026-09-11 — two compounding gaps: `client-portal`'s
  `app/baa/page.tsx` never displayed any terms text at all, just a
  name field and an "Accept BAA" button; and `AcceptBaaDto.termsVersion`
  was client-suppliable and optional, so a caller could record an
  acceptance (and its tamper-evident digest) against a version string
  that was never real, made up on the spot. Added
  `BaaComplianceService.getCurrentTerms()` (returns
  `{ version, text }` straight from `baa-terms.ts` — the exact string
  `generateDigest` hashes over) behind a new
  `GET /compliance/baa/terms`, same guard/roles as accept itself.
  Removed `termsVersion` from `AcceptBaaDto` entirely —
  `recordAcceptance` now always uses `CURRENT_BAA_TERMS_VERSION`
  server-side, so a recorded digest can never point at terms text
  that was never actually shown to anyone. `client-portal`'s BAA page
  now fetches and renders the real terms text and version, and
  disables both the review checkbox and the Accept button until the
  terms have actually loaded and been checked. Covered by
  `baa-compliance.service.spec.ts` (terms accessor returns the exact
  digest input text; a caller-supplied `termsVersion` on the input is
  ignored in favor of the current one; digest determinism). Verified
  in a browser against `client-portal-dev` (new launch.json entry,
  port 3006): the page correctly calls
  `GET http://localhost:3000/compliance/baa/terms` and gates
  submission on it — confirmed via network request inspection, since
  there's no live backend to actually answer it locally (same
  `nest build`/CSRF blocker as R09). Type-checks clean on both
  `apps/api` and `apps/client-portal`.
  **"Avengers Assemble" review, 2026-09-11** — a three-persona
  (Project Lead / Design Architect / Head of Development) review of
  the whole remediation project, grounded in real repo checks and
  external research (OWASP CSRF guidance, GCP signed-URL guidance),
  surfaced two real, independently-fixed gaps in code from this
  session rather than just restating what was already known:
  `VoiceNoteStorageService.getSignedDownloadUrl` wasn't pinning
  `version: 'v4'` on its GCS signed URL, risking a silent fallback to
  the older V2 scheme (fixed — one-line addition, covered by an
  updated assertion in `voice-note-storage.service.spec.ts`); and
  `AcceptBaaDto.acceptedBy` was a free-text field taken straight from
  the request body, inconsistent with this same controller's own
  `submitBid` (which explicitly sources `vendorId` from the
  authenticated caller, "never the request body") — a legal
  acceptance record shouldn't trust a self-reported signer identity.
  Fixed: `acceptedBy` is now always the authenticated user's email,
  never client-suppliable; `client-portal`'s BAA page shows it
  read-only ("Accepting as ...") instead of an editable field.
  Type-checks and tests clean on both `apps/api` and
  `apps/client-portal`; browser-verified the updated form renders
  correctly. Full roundtable and findings synthesis published as an
  Artifact (see session for link) per the project's standing review
  convention.
  All eleven P1 findings from the audit (R01–R11) are now fixed —
  the five originally named as blocking the multi-tenant migration
  (R02, R04, R06, R07, R09), plus R01, R03, R05, R08, R10, and R11
  along the way. R08's fix isn't deployed yet (see its note above),
  and R09's browser verification is still blocked on Kevin's
  in-progress CSRF work, same as R11's — see
  `docs/architecture/multi-tenant-design-v2.md`'s timing gate for what
  (the httpOnly-cookie/CSRF work) still has to land before that
  migration can actually start. Remaining from the original audit:
  the P2 findings, R12–R20, not yet started.

- **Repo migrated: SILAServ → SILAS, 2026-09-12.** Kevin created a new,
  empty GitHub repo (`Magnificentkevin/SILAS`) and asked for a fresh
  start rather than continuing in `SILAServ`. Done as a single clean
  "Initial commit" (no carried-over history) pushed to `SILAS` as
  `main`; `SILAServ`'s full history was **not** touched or deleted —
  it's preserved both on GitHub under its own URL and locally as the
  branch `main-silaserv-legacy`, in case anything is ever needed from
  it. Local `origin` now points at `SILAS`; the old remote was renamed
  to `silaserv-legacy` rather than removed. Used the fresh-start moment
  to also drop two small tracked hygiene issues instead of carrying
  them forward: `apps/api/tsconfig.build.tsbuildinfo` (a build
  artifact, flagged earlier by the DevOps audit) and two empty leftover
  `boot.*.log` files, both now gitignored.
  **This surfaced a real, already-blocking deployment bug while
  checking `client-portal`'s Vercel project**, unrelated to the repo
  move itself but found because of it: the project's **Root Directory
  was set to `.`** (the whole monorepo) instead of `apps/client-portal`
  — every deployment for at least the last several hours had been
  failing (`routes-manifest.json` not found) or, worse, some had
  apparently built and served **`marketing-site`'s pages instead of
  client-portal's**. Also had to reconnect the Vercel project's GitHub
  integration to the new `SILAS` repo (Vercel's GitHub App needed
  explicit access granted to the new repo first — a GitHub-side
  permission grant Kevin did himself). Both fixed: reconnected the git
  integration, corrected Root Directory to `apps/client-portal` via the
  Vercel API (no CLI subcommand exposes this setting), then triggered a
  real redeploy via a push (CLI-triggered deploys don't respect a
  monorepo's Root Directory setting the same way a GitHub-triggered
  build does — confirmed the hard way first). New deployment verified
  `● Ready` with real client-portal routes (`/`, `/login`, `/baa`) all
  returning 200, not marketing-site's.
  That redeploy also confirmed, live, the CORS fragility already
  predicted in this file: the new deployment's URL didn't match the
  one hardcoded origin in `main.ts`. Fixed properly this time — see the
  R04/telemetry entry above for the fix and live verification.

## Planned

- **Multi-tenant / multi-vertical architecture** — design proposal
  written 2026-09-11 at `docs/architecture/multi-tenant-design.md`,
  triggered by reviewing a general-contractor/construction use case
  against the current (single-tenant, cleaning-only) architecture.
  Decided rollout: commercial cleaning (All Business Cleaning) becomes
  the first formal `Tenant` under the new model with zero behavior
  change, then construction becomes the second, proving the
  extensibility point, before further markets are added the same way.
  Not yet implemented — design-first, pending review before any schema
  changes land.

## Deferred (known, accepted tradeoffs)
- Context Adapter (family A) real-browser verification — tested with
  `happy-dom`, not an actual browser (Playwright). Not installed; no host
  page exists to test against yet.
- WebAuthn/FIDO2 attestation for claim 5 — `Settlement Service.verify()`
  currently accepts any caller-supplied string as the verifier identity,
  no cryptographic proof.
- Context Adapter (family A) is built and tested but not wired into the
  same reproducible demo trace as the other six mechanisms — architectural,
  not an oversight (no server-side Saga step fits a client-side DOM
  primitive). Pre-Flight (family F) *is* wired in (`pre-flight-validation`,
  as of 2026-09-08) — an earlier version of this file said otherwise; fixed
  2026-09-10 after finding the doc had drifted from the actual code.
- Operator Console (MVP module 10) — no dedicated UI for Saga/audit state;
  not claim-relevant (no claim number tied to it), so intentionally low
  priority.
- Failure-path demo doesn't exercise `SettlementService.release()` — the
  injected failure happens before settlement is reached in the current
  trace.
