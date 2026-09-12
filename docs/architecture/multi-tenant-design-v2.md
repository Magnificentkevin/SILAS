# Multi-Tenant / Multi-Vertical Architecture — Design Proposal (Revision 2)

**Status: revised proposal, not yet implemented.** Written 2026-09-11, revised 2026-09-11
after a full team review (CTO/Dario, Product/Steve, Tech PM/Jeff, DevOps/Werner) plus a
follow-up round on vendor/labor referral. This is a separate file from the original proposal
(`multi-tenant-design.md`), kept on purpose so the original attempt and the reasoning that
changed it both stay visible rather than one overwriting the other. Nothing in this document
has been implemented — it's the plan to build against once implementation actually starts
(see **Timing gate** below for exactly what has to happen first).

## What SILAS actually is

Worth stating explicitly, because it's the north star the rest of this design generalizes
around: SILAS is a universal system for expediting and managing labor production — not a
cleaning tool that happens to be reusable, and not an abstract "multi-industry config"
platform for its own sake. Every vertical is an instance of the same three underlying
concerns:

- **Labor** — the people/crews/subcontractors who do the work (`AccountMembership`'s
  VENDOR role, `field-tablet`'s users, a construction subcontractor bidding on a phase —
  all the same underlying concept wearing different labels).
- **Production** — the work itself being scoped, tracked, and verified (a cleaning
  `ScanEvent`, a construction progress photo, a materials delivery — all "evidence that
  labor happened, where, and when").
- **Expediting** — the mechanisms that move work forward and gate it correctly
  (`ScheduleLock`'s readiness gates, the Lease Service, the Saga Engine's multi-step
  orchestration — already generic, already built).

This is why the mechanism layer (Saga, Lease, CRDT sync, Audit Vault) needed no rework for a
second vertical, and why the business-logic layer (`BomEngine`, `ScheduleLock`'s specific
checks) did: the mechanisms were already built at the level of "labor production," the
business logic was built at the level of "cleaning" specifically. The `CostEstimator`
interface and the tenant-configurable readiness checks (below) are the fix — pushing the
vertical-specific detail down into swappable implementations while keeping the universal
labor/production/expediting shape as the actual platform.

## The problem

SILAS today has no concept of a tenant. Every model — `Account`, `User`, `ScanEvent`, `Run`,
`ScheduleLock`, etc. — implicitly belongs to the one business running this deployment (All
Business Cleaning). There's no boundary that would let a second, unrelated business (e.g. a
general contractor) run on the same platform with its own customers, its own branding, and its
own business rules, without either standing up a second deployment or silently mixing two
businesses' data together.

The requirement: SILAS needs to be generic, and the end customer (e.g. a general contractor)
needs to be able to customize functions to represent their own brand and market niche.

## What doesn't need to change

Worth stating plainly, because it's good news for the platform's genericity claim: the
mechanism layer is already tenant-agnostic and needs no rework —

- Saga Engine, Audit Vault, Settlement Service, Lease Service, Metadata Sync (CRDT), Context
  Adapter, Pre-Flight Engine (`packages/silas-core`) — all operate on IDs and payloads handed
  to them; none assume "the one business."
- `field-tablet`'s scan/photo/geolocation capture — scoped by whatever account context the
  logged-in user's membership implies, not hardcoded to a business.

The gap is entirely in the business-logic layer built on top of these mechanisms:
`BomEngine`, `ScheduleLock`'s specific checks, and the fact that "which business is this"
isn't a first-class concept anywhere in the schema.

## Proposed data model

### `Tenant`

A new top-level model that everything else nests under.

```prisma
model Tenant {
  id           String   @id @default(uuid())
  name         String                 // "All Business Cleaning Inc"
  slug         String   @unique       // "all-business-cleaning" — see Tenant resolution below
  industryType String                 // "CLEANING" | "CONSTRUCTION" | ... (see Vertical modules)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  brandConfig TenantBrandConfig?
  accounts    Account[]
}
```

`Account.tenantId` gets added, and every model that already hangs off `Account`
transitively inherits tenant scope through it.

### ⚠️ Correction from CTO review: not everything actually hangs off `Account` today

The original version of this doc claimed "every model that already hangs off `Account`
(`ScanEvent`, `Run`, `Opportunity`, `ScheduleLock`, `BaaAcceptance`, etc.) is transitively
tenant-scoped through it." **That's true for `Run`, `Opportunity`, `BaaAcceptance`,
`FacilityGeofence`, `TelemetryPing`, and `ScheduleLock`** (all carry an `accountId`/
`facilityId` FK today) — **but it is factually wrong for `ScanEvent`, `Asset`, and the
entire financial ledger** (`LedgerAccount`, `JournalEntry`, `LedgerPosting`). None of these
have an `accountId` field at all. Confirmed directly against
`packages/database/prisma/schema.prisma` and the raw SQL insert in
`apps/api/src/modules/scans/scans.service.ts` (lines 44-49), which has no account column to
populate.

**Consequence if left unfixed:** a second tenant's scan events, assets, and entire financial
ledger would land in the same global tables as the first tenant's, with no column to even
filter on — a real cross-tenant leak in the two most sensitive categories of data (physical
work evidence and money), not a query-pattern nitpick.

**Fix, required before step 1:** add `accountId` to `ScanEvent` and `Asset`. This is cheap to
do *now*, independent of the tenant model — there's only one tenant's worth of data to
backfill, and a scan tying only to the user who captured it (not to which project/account it
belongs to) is a real gap the construction use case needs closed regardless of multi-tenancy.
The financial ledger tables need their own explicit decision: either they gain `accountId`
too, or they're deliberately designed as tenant-shared reference data (e.g. a single chart of
accounts) — the doc does not yet pick one, and implementation must not proceed on this model
until that choice is made explicit here.

**Also flagged by CTO review, not yet solved, worth naming:** any service that looks up an
`Account`-linked row directly by ID (skipping a `WHERE account.tenantId = ...` join) becomes
a potential cross-tenant leak point once `Tenant` exists — e.g.
`prisma.scanEvent.findUnique({ where: { clientScanId } })` in `scans.service.ts` (lines 63,
78). This needs a repository-layer convention or lint rule, not just guard-level enforcement.
Not blocking step 1, but should be resolved before step 2 ships.

### Staff roles become tenant-scoped, not global

`User.globalRole` today is a single global field (`ADMIN`/`OPERATOR`/`VERIFIER`) — an admin
is implicitly an admin *everywhere*. In a multi-tenant world that's a cross-tenant privilege
leak. Fix: replace the single `globalRole` field with a membership table, mirroring the
pattern `AccountMembership` already uses for external roles:

```prisma
model TenantStaffMembership {
  id       String       @id @default(uuid())
  userId   String
  user     User         @relation(fields: [userId], references: [id])
  tenantId String
  tenant   Tenant       @relation(fields: [tenantId], references: [id])
  role     StaffRole    // ADMIN | OPERATOR | VERIFIER, scoped to this tenant only

  @@unique([userId, tenantId])
}
```

**Mechanism, made explicit per CTO review (this was previously left implicit — that was the
gap):** `RolesGuard` today does zero database calls (confirmed against
`apps/api/src/modules/auth/roles.guard.ts`) — the JWT is fully self-contained, with
`globalRole` and the full `memberships` array embedded at login time
(`jwt-payload.ts`, `auth.service.ts` lines 52-60). `TenantStaffMembership` follows the
**same pattern**: embedded in the JWT at login, not looked up per request. This is an
acceptable tradeoff here because staff role assignments are relatively stable — the existing,
already-accepted cost is that revocation only takes effect on next login, exactly like
`AccountMembership` today. (Contrast with `JobReferral` in the vendor/labor referral section
below, which churns too fast for this and explicitly does *not* follow this pattern — the two
mechanisms are deliberately different, not an inconsistency to fix later.)

**The guard rewrite itself, spelled out (this is the part most likely to be "fixed" only on
paper if left vague):** `roles.guard.ts` line 55 today does
`if (user.globalRole === 'ADMIN') return true` — an unconditional bypass, no account check at
all, because today "admin" only ever means one thing globally. Line 61 does the equivalent for
OPERATOR/VERIFIER. **Step 2 must rewrite both of these branches to also check tenant
standing** — e.g. `if (hasTenantRole(user, targetAccount.tenantId, 'ADMIN')) return true`,
where `targetAccount.tenantId` is resolved from the request's account context. Introducing
`TenantStaffMembership` as a table without rewriting these two branches means the guard keeps
behaving exactly as it does today (global bypass) while looking like it's been fixed — the
new table doing nothing until the guard's control flow actually consults it. **This rewrite is
part of step 2's definition of done, not a separate follow-up.**

**This is the highest-risk, highest-rigor part of the whole design.** It ships with its own
cross-tenant isolation test suite — see **Migration path**, step 2, where this is now a hard
gate rather than a separately-numbered step that could ship without it.

### Branding and terminology

```prisma
model TenantBrandConfig {
  id             String @id @default(uuid())
  tenantId       String @unique
  tenant         Tenant @relation(fields: [tenantId], references: [id])
  displayName    String            // "Acme Contracting" vs "All Business Cleaning"
  logoUrl        String?
  primaryColor   String?
  terminology    Json              // { "account": "Project", "scanEvent": "Progress Photo", "run": "Site Visit" }
  enabledModules String[]          // which vertical modules this tenant runs — see below
}
```

`terminology` is the literal answer to "customize functions to represent their brand and
market niche" — it's data, not English strings hardcoded into JSX. Frontend apps read it
through a `useTerminology()` hook backed by a context provider seeded from the tenant's
config at load, instead of hardcoding "Facility" or "Scan" directly in components.

**Caution flagged by CTO review:** "facility" language is not just a frontend string today —
it's baked into backend column/field names (`ScheduleLock.facilityId`,
`FacilityGeofence.facilityId`, `TelemetryPing.facilityId` all alias `Account`'s primary key as
`facilityId`). `terminology` is display-only; it is not an invitation to rename backend
fields, and nobody implementing this should confuse the two.

**Gap flagged by PM review, not yet solved — deliberately deferred, not silently skipped:**
nothing in this doc describes how a `TenantBrandConfig` row actually gets *created* for a new
tenant. For tenant #2 (construction pilot), a manually-seeded row via migration/admin access
is an acceptable stopgap — Kevin's team will be white-glove onboarding one pilot customer
anyway. It stops being acceptable the moment "further markets follow the same pattern" is
supposed to mean anything close to self-serve onboarding. **Needs its own small design pass
before tenant #3**, not before tenant #2. Tracked here so it isn't discovered mid-onboarding
of a fourth customer with an ops team hand-writing terminology JSON.

## Pluggable business logic

`BomEngine` (materials cost, hardcoded to cleaning-chemical coverage rates) and
`ScheduleLock` (five hardcoded boolean readiness checks, cleaning-specific by name —
`robotSocOk`, `quietHourClearanceOk`, etc.) are the two places actual business rules are baked
into code rather than configured.

**Option A — one class per vertical, selected by tenant config. Confirmed sound by CTO
review, adopted.** Define a `CostEstimator` interface; today's `BomEngine` becomes
`CleaningBomEstimator`, and a new `ConstructionEstimator` implements the same interface
(materials + labor + subcontractor cost + margin + timeline). A tenant's `industryType` /
`enabledModules` selects which implementation runs. `ScheduleLock`'s five fixed columns become
a generic `checks: Json` (or a child table) so the *set* of checks is tenant-configured data.

Option B (a fully data-driven rules engine) was considered and rejected: CTO review read both
`bom.engine.ts` (66 lines — one 2-entry coverage-rate table plus one formula) and
`scheduling-lock.service.ts` (84 lines — five inline booleans) in full and confirmed there
isn't enough real variance on display yet to justify a DSL. Option A is the right amount of
engineering for two known verticals and doesn't foreclose Option B later if a third or fourth
vertical shows the same pattern repeating in a way a class-per-vertical can't express well.

## Vendor/labor referral and the directory ("the right man for the job")

**This section replaces what was previously an open, unresolved question in this doc.**
Kevin's requirement, given directly: clients need to (a) have SILAS auto-refer a job to a
matching vendor by skill, and (b) browse/search the vendor and labor database themselves to
pick who to engage. Both turned out to be the same underlying mechanism with two entry
points — one design addition, not two.

**Explicitly not a shared job board.** A vendor never sees another tenant's general job
board or other jobs unrelated to what they were specifically referred to or selected for.
Kevin's own framing: "a cleaning company can order a plumber from silas, but the plumber
wont see all available cleaning jobs — those are held available to cleaning personnel."

### Data model — two new models, additive, alongside `AccountMembership`

```prisma
model VendorSkill {
  id           String  @id @default(uuid())
  vendorId     String                    // FK to User.id — tenant-independent, owned by the vendor
  vendor       User    @relation(fields: [vendorId], references: [id])
  skill        String                    // controlled vocabulary — see Skill taxonomy below
  verified     Boolean @default(false)   // see Verification, deferred section below
}

model JobReferral {
  id            String            @id @default(uuid())
  vendorId      String
  vendor        User              @relation(fields: [vendorId], references: [id])
  runId         String?
  run           Run?              @relation(fields: [runId], references: [id])
  opportunityId String?
  opportunity   Opportunity?      @relation(fields: [opportunityId], references: [id])
  status        JobReferralStatus // PENDING | ACCEPTED | DECLINED | COMPLETED | REVOKED
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  // exactly one of runId / opportunityId must be set (app-level or DB check constraint)
}
```

Design notes, per CTO review:

- **`VendorSkill` has no `accountId`/`tenantId`.** A vendor's skill belongs to them, not to
  whichever tenant they're currently working for — consistent with `User` already being a
  global, tenant-independent identity model.
- **`JobReferral` sits alongside `AccountMembership`, not instead of it.** They answer
  different questions — "does this vendor have a standing relationship with this whole
  account" vs. "is this vendor allowed to see this one job." Collapsing them would weaken
  `AccountMembership`'s all-or-nothing meaning. This is a genuinely *tighter* isolation
  boundary than today's account-wide vendor membership, not a looser one.
- **Two nullable FKs (`runId?`, `opportunityId?`), not a unifying `Job` table.** `Run` and
  `Opportunity` are structurally separate today with no shared parent. Introducing a
  polymorphic `Job` table `Run`/`Opportunity` would migrate under is a bigger, riskier
  refactor not otherwise motivated by this feature — don't let a narrow referral feature drag
  it in.
- **No `tenantId` column on `JobReferral` either** — inherits tenant scope transitively
  through `runId`/`opportunityId` → `accountId` → `tenantId`, same principle as everywhere
  else in this doc.

### Access control — a separate, purpose-built guard, not a third dimension on `RolesGuard`

Confirmed by CTO review: account-membership checks and tenant-staff checks are both
"container-level" questions (does this user have standing over an entire `Account`/`Tenant`)
— same axis, different scope, which is why folding tenant-staff into `RolesGuard` is
reasonable. A job-scoped grant is a different *kind* of question (does this user have standing
over exactly one row) and mixing it into the same decision tree that every account/tenant-
scoped route already depends on raises the guard's complexity and audit risk right when this
whole design is trying to reduce exactly that.

**Decision: a separate `JobReferralGuard` + `@RequireJobReferral()` decorator**, applied only
to the small number of vendor-facing single-job routes (view this job's detail, submit a bid/
status update on this job). Independently unit-tested, mirroring the existing cross-account
isolation pattern in `roles.guard.spec.ts` (e.g. "vendor referred to Job A is denied on Job
B").

**Mechanism: live DB lookup per request, not JWT-embedded — deliberately different from
`TenantStaffMembership` above.** Job referrals churn constantly (referred → accepted →
completed → referred to the next job, or revoked mid-job) in a way staff roles don't.
Embedding referral grants in the JWT the same way `AccountMembership`/`TenantStaffMembership`
are would mean a vendor could keep acting on a job for their whole session even after being
unreferred or the job closing out — a real leak that would look identical to how the other two
already behave, making it hard to notice. `JobReferralGuard` must do a live query, and this
divergence from the JWT-embedding pattern used elsewhere in this doc is intentional, not an
inconsistency to reconcile later.

### Directory scoping — what a tenant sees when browsing

When a tenant browses the vendor/labor directory: **skills and a public reputation signal,
never** another tenant's contract terms, negotiated pricing, private notes, or job history
with that vendor. The directory itself (skills + public rating) is shared and browsable
across tenants by design; the actual engagement data (what job, what price, what happened)
stays scoped to the tenant plus the job-scoped `JobReferral` grant. This is a clean dividing
line, not a compromise.

### Existing bug this reshapes, not just relates to

`apps/api/src/modules/compliance/compliance.controller.ts`'s `POST /compliance/bids` (fake
`{accepted: true}` response, no persistence — external audit finding R06) is not just a nearby
defect. Once `JobReferral` exists, that endpoint's actual shape becomes "respond to a
referral" (accept/decline against a `JobReferral` row), not "submit an open bid." **Fixing R06
and building this model are the same piece of work** — don't fix R06 in its current shape and
then redo it once `JobReferral` lands.

### Explicitly deferred — its own follow-up design pass, comparable in scope to `TenantStaffMembership`

Not solved here, and deliberately not bolted on as a paragraph (per PM review — these are each
real, schema-and-workflow-shaped design efforts):

- **Referral state machine** — the full lifecycle (offered → accepted/declined → in-progress
  → completed), what happens on a vendor ignoring a referral, timeout/expiry behavior. Maps
  cleanly onto the existing Saga Engine, which is a point in favor of the design, but is new
  schema surface, not a status-field toggle.
- **Skill taxonomy and verification tiers** — "plumbing" needs to be a controlled vocabulary
  SILAS defines, not free text each tenant/vendor invents differently. Separately: nothing
  today distinguishes a self-declared skill from a verified one (licensed, background-checked,
  etc.) — referring a job to an unverified vendor is a liability surface for SILAS itself, not
  just the referring tenant. Needs at minimum a verified/unverified state before referral goes
  live for real.
- **Rating/history model.** Because `VendorSkill` is tenant-independent, the natural
  conclusion (per PM review) is that job history and ratings should accrue to the vendor's own
  profile, portable across every tenant that refers them — not siloed per tenant. This is what
  makes tenant-independent skill profiles actually valuable rather than just an isolation
  mechanism: SILAS becomes the system of record for "is this vendor good," which no single
  tenant could build alone. **This is the same gap already listed in `docs/ops/tracker.md` as
  "review/rating system — missing entirely."** One design effort should cover vendor
  reputation once, serving both this referral flow and that original tracker item — not two
  parallel efforts arriving at two different models.
- **Availability signal without leakage.** A tenant deciding whether to request a referral
  needs to know if a vendor has capacity this week, without seeing what job/tenant currently
  occupies them — a capacity signal, not job detail. Falls directly out of the "only sees the
  one job" rule and needs to be named as its own small requirement when this follow-up design
  happens.

## Migration path

Renumbered from the original version to make the isolation-test gate structural rather than a
stated intention (this was Tech PM review's core finding: "should land with step 2" was prose,
not a mechanism — nothing prevented step 2 shipping without it).

0. **Fix R06** (`compliance.controller.ts`'s fake-success bid endpoint) in its *final* shape —
   i.e., roughly concurrent with or just before step 7, not fixed once now and redone later.
   Independently required regardless of the tenant model; listed here so it's tracked as a
   named prerequisite, not an "open question" that quietly never gets scheduled.
1. Create `Tenant`, backfill a single row ("All Business Cleaning Inc", `industryType:
   "CLEANING"`) and point every existing `Account`/`User` at it. Add `accountId` to
   `ScanEvent`/`Asset` (see correction above) as part of this same step, while there's only
   one tenant's data to backfill. **Verification checkpoint before step 2 begins:** row
   counts match, no orphaned FKs, a smoke test against staging — not just "the migration ran
   without erroring."
2. Introduce `TenantStaffMembership`; migrate existing `globalRole` values into it scoped to
   the seed tenant. **Before dropping `User.globalRole`:** diff old role assignments against
   the new membership rows to confirm a lossless migration — this is a one-way schema change
   and needs its own explicit verification, not just "migrate then drop" as a single motion.
   **Rewrite `RolesGuard`'s ADMIN and OPERATOR/VERIFIER branches** to consult
   `TenantStaffMembership` (see the spelled-out rewrite above) — this is part of this step's
   definition of done. **The cross-tenant isolation test suite (a Tenant-A admin denied on a
   Tenant-B account, mirroring the existing cross-account tests) is a hard gate on this step's
   completion, not a separately schedulable ticket.** Step 2 is not "done" without it merged in
   the same change.
3. Add `TenantBrandConfig`, seed the cleaning tenant's terminology to match today's English
   strings exactly (so nothing visibly changes until a second tenant exists).
4. Wire frontends to read terminology through the new `useTerminology()` hook instead of
   hardcoded strings.
5. Convert `BomEngine`/`ScheduleLock` to the Option-A strategy pattern; add
   `ConstructionEstimator` as the first real second implementation. **Gate, per PM review: a
   committed construction pilot customer (or at minimum a paid LOI), not just the use-case
   document that prompted this design.** Building the estimator and readiness-check set
   against a hypothetical customer risks getting the cost model or gating checks wrong in ways
   only a real GC's actual workflow would catch — cheaper to learn that before this step than
   after. **Kill criterion, stated explicitly rather than left implicit:** if this work reveals
   Option A doesn't actually fit construction's business logic cleanly, that's a signal to stop
   and reassess before a third vertical is ever discussed, not to push through and call it
   proven anyway.
6. Update `prisma/seed.ts` (or equivalent), test fixtures, and local dev setup/docs that
   currently reference `globalRole` — absent from the original version of this path entirely;
   without it, local dev and CI test data setup break silently once step 2 lands.
7. `VendorSkill` + `JobReferral` + `JobReferralGuard` (see the dedicated section above).
   **Sequenced after step 2 and its isolation suite, not before** — `JobReferral` inherits
   tenant scope transitively through `Account`/`Tenant`, so it should be built and tested
   against a schema where tenant scoping already exists and is verified, rather than building
   it against the pre-tenant shape and revisiting it once `Tenant` lands.

**Additional required checkpoint not in the original numbered list:** every step above that
touches `apps/api/src/modules/auth/*` needs to be sequenced against whatever's in that
directory at the time — see **Timing gate** below for why that currently means "after," not
"concurrently."

## Timing gate — when this is actually allowed to start

**Not now, even with this revision complete.** Three concrete, current reasons, not a general
caution:

1. **The auth surface is mid-change and uncommitted right now.**
   `apps/api/src/modules/auth/csrf.guard.ts` has an explicit `TODO(human)` blocked on Kevin
   personally, with a standing instruction not to edit or route around it. Step 2 above is a
   second, independent change to the same `RolesGuard`/auth layer. Two concurrent
   modifications to `apps/api/src/modules/auth/*` — one adding a CSRF comparison, one adding a
   tenant dimension to role checks — is exactly the situation that produces silent merge
   conflicts or a clean-looking merge that reintroduces a security gap either change was meant
   to close.
2. **Unfixed P1 findings from the external security audit are the same *category* of bug this
   design exists to prevent, one level down.** R02 (ownership check gap on voice-note
   overwrite), R04 (stale telemetry validating unrelated new work), R06 (the bid-submission
   bug — see step 0 above), R07 (tablet account-switching misattribution), R09 (stale facility
   lock result readable across facilities) are all "wrong scope/ownership boundary" bugs at the
   account level. Building tenant-level isolation on top of a known-leaky account-level layer
   risks the tenant boundary inheriting the same class of bug the audit already found
   underneath it.
3. **Live production, zero slack, no offsetting urgency.** `client-portal`, the backend, and
   `field-tablet` are all live serving All Business Cleaning's real operations. Step 2 above
   includes a destructive schema change (dropping `globalRole`) to the system currently in
   production use, on top of two other in-flight, uncommitted auth changes. There is no second
   tenant on the platform today — nothing is lost by sequencing this after the in-flight work
   lands instead of alongside it.

**Gate, stated as a blocking dependency, not left implicit:** step 1 of this migration path
does not start until (a) the httpOnly-cookie/CSRF migration is committed, and (b) P1 audit
findings R02, R04, R06, R07, and R09 are resolved. `docs/ops/tracker.md` should reflect this
dependency explicitly.

**Heads-up worth surfacing now, per PM review, not a design concern but a real one:** steps
1-4 have no external customer-visible payoff by themselves — pure infra work on the business
currently paying the bills, with the construction opportunity visibly sitting there
unaddressed until step 5. That's the right call architecturally (prove tenant isolation on the
one tenant that exists before a second tenant's real data is on the line), but it should be
named going in so "why haven't we started construction yet" doesn't become a mid-migration
surprise.

## Resolved open questions

Previously listed as unresolved in this doc's first version; both are now settled.

- **Tenant resolution: by authenticated user/login context, not subdomain routing.** DevOps
  review found subdomain routing (`acme.silaserv.com`) would require greenfield wildcard
  DNS/TLS work (no custom domain is wired to Vercel or Cloud Run for any app today), per-app
  wildcard domain config on every Vercel project, and turning `main.ts`'s fixed CORS allowlist
  into a dynamic suffix-match with real security implications — directly touching the
  CSRF/cookie work already in flight. Login/context-based resolution requires none of this: no
  DNS, no cert, no CORS changes at all. Subdomains remain a pure product/branding add-on that
  can layer on later without disrupting the tenant data model; there's no reason to take on
  that infrastructure cost before any app has a live custom domain at all.
- **Vendor/subcontractor marketplace: resolved by the referral/directory section above**,
  not left as a tenant-scoped-vs-shared binary. See that section for the full model.
