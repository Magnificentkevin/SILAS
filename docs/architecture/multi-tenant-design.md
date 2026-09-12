# Multi-Tenant / Multi-Vertical Architecture — Design Proposal

**Status: proposal, not yet built.** Written 2026-09-11 after reviewing a construction-industry
use case (`SILAS.docx`) against the current codebase. Nothing in this document has been
implemented — it's the plan to review before any schema or code changes happen.

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
`BomEngine`, `ScheduleLock`'s five fixed checks, and the fact that "which business is this"
isn't a first-class concept anywhere in the schema.

## Proposed data model

### `Tenant`

A new top-level model that everything else nests under.

```prisma
model Tenant {
  id           String   @id @default(uuid())
  name         String                 // "All Business Cleaning Inc"
  slug         String   @unique       // "all-business-cleaning" — subdomain/URL-safe
  industryType String                 // "CLEANING" | "CONSTRUCTION" | ... (see Vertical modules)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  brandConfig TenantBrandConfig?
  accounts    Account[]
}
```

`Account.tenantId` gets added, and every model that already hangs off `Account`
(`ScanEvent`, `Run`, `Opportunity`, `ScheduleLock`, `BaaAcceptance`, etc.) is transitively
tenant-scoped through it — no need to add `tenantId` to every single table individually.

### Staff roles become tenant-scoped, not global

This is the part most likely to be gotten wrong if rushed, so it's called out on its own.
`User.globalRole` today is a single global field (`ADMIN`/`OPERATOR`/`VERIFIER`) — meaning an
admin is implicitly an admin *everywhere*. In a multi-tenant world that's a cross-tenant
privilege leak: staff at Tenant A must not have any authority at Tenant B by default.

Fix: replace the single `globalRole` field with a membership table, mirroring the pattern
`AccountMembership` already uses for external roles — SILAS already has the right shape for
this one level down, it just needs to move up a level:

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

`RolesGuard` gains a second dimension on top of what it already does: not just "does this
user hold role X on account Y," but "does account Y belong to a tenant this user has any
standing in at all." **This is the highest-risk, highest-rigor part of the whole design** —
get it wrong and one tenant's staff can see another tenant's data. It should ship with its own
cross-tenant isolation test suite, mirroring the existing cross-account tests in
`roles.guard.spec.ts` but one level up (a Tenant-A admin must be denied on a Tenant-B account,
exactly like a Tenant-A vendor is already denied on a different account today).

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
config at load, instead of hardcoding "Facility" or "Scan" directly in components. This is the
same shape the marketing apps already use for their own `site-config.ts` pattern, just
promoted from a build-time per-app file to a runtime per-tenant database row.

## Pluggable business logic — the deep part

`BomEngine` (materials cost, hardcoded to cleaning-chemical coverage rates) and
`ScheduleLock` (five hardcoded boolean readiness checks, cleaning-specific by name —
`robotSocOk`, `quietHourClearanceOk`, etc.) are the two places actual business rules are baked
into code rather than configured. Two real approaches, with a recommendation:

**Option A — one class per vertical, selected by tenant config (recommended).**
Define a `CostEstimator` interface; today's `BomEngine` becomes `CleaningBomEstimator`, and a
new `ConstructionEstimator` implements the same interface (materials + labor + subcontractor
cost + margin + timeline, per the construction use case). A tenant's `industryType` /
`enabledModules` selects which implementation runs. `ScheduleLock`'s five fixed columns become
a generic `checks: Json` (or a child table) so the *set* of checks is tenant-configured data,
not fixed schema — a construction tenant defines "permits pulled," "site prepped," "materials
delivered" instead of "quiet hour clearance."

**Option B — fully data-driven rules engine.**
Go further: even the calculation formulas (coverage rates, cost line items, margin
percentages) live in the database and get interpreted by one generic engine, with no new
TypeScript class needed per vertical.

**Recommendation: start with Option A.** With only two verticals as real evidence
(cleaning, and the construction use case under review), a full rules-engine DSL is solving a
problem SILAS doesn't have real evidence for yet, and it's meaningfully harder to build,
test, and reason about correctly. Option A is a real, working extensibility point today and
doesn't foreclose moving to Option B later if a third or fourth vertical shows the same
pattern repeating in a way a class-per-vertical can't express well. This is a genuine
judgment call, not a foregone conclusion — worth deciding deliberately rather than by default.

## Decided rollout sequencing

The target is real multi-tenancy (full `Tenant` data isolation, not just the cosmetic
branding-layer alternative) — but rolled out in this order, not built all at once for
hypothetical tenants:

1. **First tenant: commercial cleaning** (All Business Cleaning). The existing business
   becomes `Tenant` #1 under the new model — this is what "zero behavior change" in the
   migration path below means: the real business keeps running exactly as it does today,
   just now formally modeled as one tenant among a schema that supports more.
2. **Prove the extensibility point with a second vertical** once the foundation is solid —
   construction (per the reviewed use case) is the natural next candidate, since it's the
   one we already have a real use-case document for. This is what step 5 in the migration
   path below (`ConstructionEstimator` as the first real second `CostEstimator`
   implementation) is building toward.
3. **Further markets after that**, added the same way each new vertical was — a new
   `Tenant`, a new `TenantBrandConfig`, and (if its business rules don't fit an existing
   `CostEstimator`/readiness-check implementation) a new vertical module.

The point of building the foundation now rather than deferring it is exactly this: get
cleaning's own migration onto the tenant model right first, while there's only one tenant
and mistakes are cheap to fix, rather than retrofitting tenant isolation later once a second
real business's data is already on the platform.

## Migration path

1. Create `Tenant`, backfill a single row ("All Business Cleaning Inc", `industryType:
   "CLEANING"`) and point every existing `Account`/`User` at it. Zero behavior change —
   there's only one tenant today anyway.
2. Introduce `TenantStaffMembership`, migrate existing `globalRole` values into it scoped to
   the seed tenant, then drop `User.globalRole`.
3. Add `TenantBrandConfig`, seed the cleaning tenant's terminology to match today's English
   strings exactly (so nothing visibly changes until a second tenant exists).
4. Wire frontends to read terminology through the new hook instead of hardcoded strings.
5. Convert `BomEngine`/`ScheduleLock` to the Option-A strategy pattern; add
   `ConstructionEstimator` as the first real second implementation, proving the extensibility
   point actually works rather than just existing in theory.
6. Cross-tenant isolation test suite — should land with step 2, not be deferred after it.

## Open questions to settle before implementation starts

- **Subdomain/URL routing**: does each tenant get its own subdomain (`acme.silaserv.com`),
  or is tenant selected some other way (login-time selection, a single URL with tenant
  inferred from the authenticated user)? Affects `main.ts`'s CORS allowlist design and how
  `client-portal`/`staff-console` resolve which tenant's data to show.
- **Vendor/subcontractor marketplace and reviews** (missing entirely today, per the earlier
  gap analysis) — should these be tenant-scoped (each business has its own private vendor
  list) or shared/global (subcontractors show up for multiple GC tenants, with ratings that
  carry across)? This is a real product decision, not just an engineering one.
- **Existing bid-submission bug** (`compliance.controller.ts`'s `POST /compliance/bids`
  currently returns `{accepted: true}` with no persistence — a defect independent of this
  design) needs fixing before subcontractor bidding is real under any tenant model.
