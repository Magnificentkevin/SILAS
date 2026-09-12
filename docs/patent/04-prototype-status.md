# Prototype Status

**Status: factual snapshot, updated 2026-09-10 (originally dated
2026-09-07).** This maps the MVP Technical
Specification's 10 modules and the Claim & Mechanism Map's 7 claims to what
actually exists as tested, running code — not what's planned. Every "built"
row below has a corresponding automated test and, where noted, a live
verification against a real database. This is the evidence for the Patent
Core Audit's **Prototype gate**: *"At least one reproducible runtime trace
demonstrates the core technical sequence."*

## By MVP module

| # | Module | Family | Status | Evidence |
|---|---|---|---|---|
| 01 | Auth/RBAC | *(unmapped — see crosswalk)* | **Built & tested** | `apps/api/src/modules/auth`. 19 automated tests (10 for the tenant-isolation guard specifically). Live-verified: cross-account denial proven against real Postgres with two real accounts, not mocks. |
| 02 | Context Adapter | A | **Built & tested** | `packages/context-adapter/src/context-adapter.ts` — a new package, since this mechanism needs real DOM APIs unlike everything else in `packages/silas-core`. 8 tests: mounts a closed-mode Shadow DOM overlay onto a host element (verified via automated test that host-page content outside the mount point is untouched); the overlay's content lives in an iframe — a genuinely separate browsing context; `send()`/`onMessage()` form an async postMessage IPC boundary, filtered by `event.source` identity so only the mounted overlay's own iframe can ever reach the handler, not a spoofed message from elsewhere on the host page. Tested with `happy-dom`, not `jsdom` — jsdom has a real gap where an iframe nested inside a Shadow Root never gets its message pump wired up (`document.body.contains()` returns `false` across the shadow boundary, which jsdom's iframe lifecycle appears to gate on); happy-dom doesn't have this gap. Not yet wired into any app-level demo — see note below. |
| 03 | Sanitization Engine | B | **Built & tested** | `packages/silas-core/src/sanitization/sanitization-engine.ts`. 8 tests: deterministic tokenization (same raw value always produces the same token, without exposing it), and — the "payment isolation" half of family B — a separate `REDACT` strategy that masks a value to its last 4 characters and never leaks the full raw value, distinct from `TOKENIZE`'s input-dependent linkability. Wired into the golden-path demo as the first step, ahead of lease/settlement, matching the MVP spec's reference-runtime order. |
| 04 | Pre-Flight Engine | F | **Built & tested** | `packages/silas-core/src/pre-flight/pre-flight-engine.ts`. 6 tests: deterministic collection of failed checks by severity, and the actual gate logic — a `BLOCKING` failure always fails regardless of warning count, while `WARNING` failures are tolerated up to a configurable threshold (`warningCount <= threshold` passes). Matches the claim map's "deterministic validator + failure threshold tests" bar directly. Wired into the golden-path/failure-path demo as `pre-flight-validation`, right after sanitization. |
| 05 | Resource Lease Service | C (finite half) | **Built & tested** | `packages/silas-core/src/lease/lease-service.ts`. 5 tests: signed lease grant, denial of a second competing client, release/expiry re-acquisition, tamper detection on the signature. |
| 06 | Metadata Sync (CRDT) | C (non-finite half) | **Built & tested** | `packages/silas-core/src/metadata-sync/metadata-sync-service.ts`. 8 tests: local writes, last-writer-wins merge against local state, and — the two properties that actually prove this is a correct CRDT rather than just "usually works" — idempotency (re-merging the same update is a no-op) and order-independence (two devices applying the same conflicting updates in opposite order converge on the identical result). |
| 07 | Saga Engine | D | **Built & tested** | `packages/silas-core/src/saga/saga-engine.ts`. 4 tests: golden-path commit, reverse-order inverse mutations reaching `RECOVERED`, `BREACH_RECOVERY` when a compensating inverse itself fails, full step-by-step trace suitable for audit sealing. |
| 08 | Settlement Service | E (settlement half) | **Built & tested** | `packages/silas-core/src/settlement/settlement-service.ts`. 11 tests: hold placement, verification, idempotent capture, and every illegal-transition guard (capture without verification, capture/verify/release on an already-finalized hold). Wired into the golden-path demo — `apps/api`'s existing `JournalService` still posts ledger entries directly and is unaffected; nothing yet calls it only after this service's verification gate passes. |
| 09 | Audit Vault | E (audit half) | **Built & tested** | `packages/silas-core/src/audit/audit-vault.ts`. 3 tests: hash-chain linkage, independent verification of an untampered chain, tamper detection at the exact broken index. |
| 10 | Operator Console | E | Not built | No dedicated UI observes Saga/audit state; `web-client`'s dashboard shows business data (CRM, pricing), not invention runtime state. |

*(External System Adapters — referenced in claim 1/6 and the MVP spec's
reference runtime, but not given a module number — have one concrete,
live-verified implementation: `packages/silas-core/src/adapters/adapter-port.ts`
+ `apps/api/.../adapters/maintainx.adapter.ts`, dispatching to a real
third-party API.)*

## By claim

| Claim | Covered by current prototype? |
|---|---|
| 1 (full integrated system) | Partial, stronger again — every mechanism family (A–F) has a tested implementation, and now five of six run in the same reproducible trace (only Context Adapter remains standalone, for an architectural reason, not a gap). Claim 1 still isn't a complete reproduction as drafted: Context Adapter (A) isn't part of the same end-to-end trace as the rest. |
| 2, 3 (context boundary / IPC) | Covered by a standalone tested implementation (`packages/context-adapter`) — closed Shadow DOM + async postMessage IPC filtered by `event.source`. Not integrated into the golden-path/failure-path demo alongside the other mechanisms (a server-side Saga has no natural place for a client-side DOM primitive), and not yet verified in a real browser engine (tested with `happy-dom`, a DOM-spec implementation, not an actual browser). |
| 4 (pre-flight check) | Covered, and integrated — `pre-flight-validation` runs as a real step in the golden-path/failure-path demo, between sanitization and lease acquisition. |
| 5 (SSO/FIDO2 attestation) | Not covered as specified — Auth/RBAC exists (JWT-based) and Settlement Service's `verify()` records a verifier identity, but neither performs actual WebAuthn/FIDO2 attestation; `verify()` currently accepts any caller-supplied string as the verifier, with no cryptographic proof behind it. |
| 6 (full method claim) | Same coverage as claim 1 — the sanitization→pre-flight→lease→metadata-sync→Saga→settlement→audit segment runs as one reproducible trace; only context-boundary (A) exists outside that trace. |
| 7 (external verification portal) | Partial — `AuditVault.verify()` is an independent verifier in code, callable via `GET /silas-core/audit/verify`, but there is no separate, read-only, access-restricted "portal" as claim 7 implies — today it's another endpoint on the same API. |

## The actual reproducible runtime trace that exists today

`apps/api/src/modules/silas-core/silas-core.service.ts` wires seven built
mechanisms — sanitization, pre-flight, lease, CRDT metadata sync, Saga,
settlement, and audit — into two demos:

- **Golden path** (`POST /silas-core/demo/golden-path`): sanitize the
  incoming payload (tokenize a customer email, redact a payment card —
  `sanitize-request-payload`) → run pre-flight validation
  (`pre-flight-validation`, two `BLOCKING` checks: resourceId present,
  sanitized payload present) → acquire a signed lease → sync resource
  metadata (a local write, then merge a simulated concurrent update from a
  second device — `sync-resource-metadata`) → dispatch to external adapters
  → place a settlement authorization hold, stage it, and record verifier
  approval (`authorize-and-stage-settlement`) → capture the settlement and
  commit → sealed into the audit chain at every step. Verified result:
  `"status":"COMMITTED"`, final settlement status `"CAPTURED"`, final
  metadata value the later (remote) write, sanitized payload showing a
  64-character token in place of the raw email and `"************4242"` in
  place of the raw card number.
- **Failure path** (`POST /silas-core/demo/failure-path`): same sequence
  with an injected adapter failure → inverse mutations run in reverse order:
  metadata sync's inverse (a deliberate no-op — CRDT state is monotonic and
  convergent, not reversible, so there is nothing to undo), the lease is
  released, pre-flight's inverse (also a no-op — a pure read-only gate has
  nothing to compensate), and sanitization's inverse (likewise a no-op — a
  pure stateless transform has no side effects to compensate) → sealed into
  the audit chain. Verified result: `"status":"RECOVERED"`. Note: the
  failure is injected at the adapter-dispatch step, before settlement is
  reached, so this specific trace does not yet exercise
  `SettlementService.release()` — that transition has unit coverage
  (`settlement-service.spec.ts`) but no live end-to-end trace yet. Closing
  that is a candidate for a future third demo, or parameterizing which step
  fails.
- **Independent verification** (`GET /silas-core/audit/verify`): re-derives
  every hash in the chain from stored fields alone. Verified result:
  `{"ok":true}` after both demo runs.

**Context Adapter (family A) is separate evidence, not part of this trace.**
Unlike the seven mechanisms above, `packages/context-adapter` isn't wired
into `SilasCoreService` — it's a client-side, DOM-dependent primitive with
no natural place in a server-side Saga. Its own prototype evidence matches
the claim map's stated bar directly: *"Host app + SILAS overlay test →
Overlay operates without prohibited host-DOM dependency."* 8 automated
tests confirm a closed Shadow DOM overlay mounts without touching
pre-existing host content, the overlay's content lives in a genuinely
separate iframe browsing context, and the async IPC channel only accepts
messages whose `event.source` is that exact iframe — a spoofed message from
any other host-page script is silently ignored. This satisfies claims 2 and
3 as standalone evidence, but not as part of the same reproducible trace as
claim 1/6's other mechanisms yet.

**Verification method for this update:** the lease/Saga/audit trio was
originally verified via live HTTP calls against a running instance with
Postgres. The settlement, metadata-sync, sanitization, and pre-flight
additions were all verified by direct in-process invocation of
`SilasCoreService` (bypassing the NestJS/HTTP/auth layer, which the
service's own logic has no dependency on) — a faster check that confirms
the same wiring, but is a narrower form of evidence than the original
live-HTTP verification. Re-running the golden/failure-path routes against a
live instance would close that gap.

This is real evidence for the B+C+D+E+F combination specifically —
sanitization, pre-flight, both halves of family C (lease and metadata
sync), Saga, and both halves of family E (settlement and audit), all in one
reproducible trace. The demo's sanitization step uses fixed demo values
rather than real operator input — fine for proving the mechanism, but worth
noting as a simplification. Family A (context boundary) is the only family
not part of this trace — real tested evidence exists (`packages/context-adapter`),
but standalone, for an architectural reason rather than an open gap: a
server-side Saga has no natural place for a client-side DOM mechanism.
**This is the first point where every mechanism family (A–F) has at least
one tested implementation, and five of the six run together in a single
reproducible trace** — the milestone the original 90-Day Execution Board
plan was ultimately building toward. It is **not** yet complete evidence
for claim 1 or 6 as currently drafted: those claims also need family A
integrated into the same trace, which doesn't exist yet.

## Gap list, in priority order for a stronger prototype gate

1. **Integrate Context Adapter (A) into the same reproducible trace as the
   other six mechanisms**, or formally document why standalone evidence is
   sufficient for claims 2/3. No server-side Saga step makes sense for a
   client-side DOM primitive, so this needs either a real host-page harness
   (a genuine "host app + SILAS overlay" test, per the claim map's own
   evidence bar) or a documented decision to treat the standalone evidence
   as sufficient. The only remaining family not in the single reproducible
   trace.
2. Smaller, lower-priority follow-ups: a live-HTTP re-verification of the
   golden path (see note above); a failure-path trace that actually
   exercises `SettlementService.release()`; replacing the sanitization
   demo's fixed values with real operator-supplied input; verifying Context
   Adapter in a real browser engine (Playwright) rather than `happy-dom`'s
   DOM-spec approximation; and, if claim 5's SSO/FIDO2 attestation is
   pursued, replacing `verify()`'s plain-string verifier identity with real
   WebAuthn/FIDO2 attestation.
3. Module 10 (Operator Console) remains entirely unbuilt, but has no claim
   number tied to it — a UI/dashboard concern rather than a patent
   mechanism, so it's intentionally not in the same priority tier as A–F.
