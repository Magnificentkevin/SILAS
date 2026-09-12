# Mechanism Decision Memo

**Status: APPROVED — 2026-09-08.** 90-Day Execution Board task P02 (due
2026-09-12), exit evidence "mechanism decision memo." Closed 4 days ahead
of deadline.

## Decision

The three highest-priority mechanism families, in order of patent priority,
are:

1. **C — Offline resource arbitration** (CRDTs for non-finite state +
   cryptographic pessimistic leases for finite assets)
2. **D — Deterministic recovery** (Saga orchestration + explicit inverse API
   mutations)
3. **E — Controlled settlement/audit** (pre-auth hold + staged ledger +
   verified approval + chained cryptographic record)

## This is not a new decision — it's a ratification of one already made

Two independent source documents already converged on this selection before
this memo existed:

- The 90-Day Execution Board's own Weeks 1–2 plan states the goal directly:
  *"Select the 3 highest-priority mechanism families: resource arbitration,
  inverse recovery, and controlled settlement/audit."*
- The Patent Core Audit independently rates exactly these three as **Very
  high** priority, versus **High** for families A and B:

  | Family | Priority (Patent Core Audit) |
  |---|---|
  | A — Context boundary | High |
  | B — Data boundary | High |
  | **C — Offline resource arbitration** | **Very high** |
  | **D — Deterministic recovery** | **Very high** |
  | **E — Controlled settlement/audit** | **Very high** |

This memo's job is to make that convergence an explicit, dated, sign-offable
decision rather than something implied across two documents — matching the
Patent Core Audit's audit action #1, "freeze the invention vocabulary," and
its warning that the C+D+E *combination specifically* is the highest-risk,
highest-value claim territory: *"Run a targeted prior-art search against
each mechanism family and especially the combination of C+D+E."*

## Why C, D, and E over A and B

Not because A (context boundary / isolated overlay) and B (data boundary /
sanitization) are unimportant — the Patent Core Audit lists both as
established, "High" priority — but because:

- **C and D together are the combination least likely to already exist in
  prior art.** Isolated browser overlays (A) and client-side data
  sanitization (B) are, per the audit's own novelty risk note, closer to
  "known technology categories individually." Cryptographically-leased
  finite-resource arbitration paired with deterministic Saga inverse
  recovery is a narrower, more specific combination.
- **E (controlled settlement/audit) is the mechanism with the clearest
  measurable commercial proof path** — the pilot's revenue and unit
  economics literally depend on settlement working correctly, so proving it
  also proves commercial viability, not just patentability.
- **C and D are the two mechanisms already built and tested** in
  `packages/silas-core` (`LeaseService`, `SagaEngine`) — engineering effort
  has already, independently, validated that this was the right technical
  priority. E is partially built (`AuditVault`); the settlement half (auth
  hold, staged ledger, human verification) is not yet implemented.

## What this does NOT decide

- Whether A and B are excluded from the eventual claim set — the Claim &
  Mechanism Map's recommended strategy explicitly keeps four claim families
  (core, state, boundary, settlement/audit), including a boundary family.
  This memo prioritizes engineering and prior-art search effort, not final
  claim scope.
- The three open terminology gaps in
  [`00-terminology-crosswalk.md`](./00-terminology-crosswalk.md) — those
  need resolving regardless of which families are prioritized first.

## Approval

- [x] Founder confirms C, D, E as the priority order for prior-art search
      (P03) and prototype completion.

**APPROVED — 2026-09-08.** C, D, E confirmed as the priority order.
