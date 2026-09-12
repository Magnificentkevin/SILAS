# SILAS Terminology Crosswalk

**Status: DRAFT — proposed resolutions below, pending founder approval.**
This is the reconciliation work the Patent Core Audit's own risk #4 calls
out as unfinished: *"Thresholds and terminology are not perfectly
consistent across documents; the specification, figures, claims, and
implementation plan must use one vocabulary."*

Four source documents each named these mechanisms differently. This maps
them to each other and to what's actually been built, and proposes a
resolution for each place they didn't line up cleanly. The reasoning is
technical/organizational, not legal — counsel should still review before
this is treated as final.

## The mapping

| Mechanism family | Claim(s) | MVP module | Built in `packages/silas-core`? |
|---|---|---|---|
| **A — Context boundary** (isolated overlay + IPC, no host DOM mutation) | Claims 2, 3 | 02 · Context Adapter | Not yet |
| **B — Data boundary** (volatile-memory sanitization + payment isolation) | *(implicit in Claim 1's combination; no dedicated claim)* | 03 · Sanitization Engine | Not yet |
| **C — Offline resource arbitration** (CRDTs + cryptographic pessimistic leases) | Claim 6 (as part of the method) | 05 · Resource Lease Service, 06 · Metadata Sync | **Yes** — `LeaseService` (the lease half only; no CRDT/metadata-sync counterpart exists yet) |
| **D — Deterministic recovery** (Saga + inverse mutations), *including the adapter layer as a supporting component (proposed — see #3 below)* | Claim 6 (as part of the method) | 07 · Saga Engine | **Yes** — `SagaEngine`; adapter layer also built (`AdapterPort`, `MaintainXAdapter`) |
| **E — Controlled settlement/audit** (pre-auth hold, staged ledger, verified approval — including attestation, proposed — and chained cryptographic record) | Claims 5, 7 | 01 · Auth/RBAC, 08 · Settlement Service, 09 · Audit Vault, 10 · Operator Console | **Partially** — `AuditVault` covers the cryptographic-chain half; settlement (auth hold + staged ledger + human verification) does not exist yet |
| **F — Pre-flight validation** *(proposed new family — see #1 below)* | Claim 4 | 04 · Pre-Flight Engine | Not yet |

## Proposed resolutions

1. **Claim 4 / module 04 (pre-flight health check) → new Family F, not
   folded into B.** Sanitization (B) is about data *privacy* before egress;
   pre-flight is about data *completeness/consistency* before execution
   starts — different concerns that happen to sit adjacent in the pipeline.
   It already has its own claim, module number, and prototype criterion in
   the source material — enough independent weight to name rather than
   merge. This doesn't change the C/D/E prioritization for near-term
   engineering or search effort (mechanism decision memo unaffected) — it
   only affects the vocabulary.
2. **Claim 5 / module 01 (SSO/FIDO2 attestation) → folded into Family E.**
   Family E's own definition already lists *"verified approval"* as one of
   its four components — attestation is the specific mechanism that
   *produces* that approval, not a precondition standing outside E. This is
   a labeling correction, not a new architectural decision.
3. **External system adapters → named as a supporting component of Family
   D, not a peer family.** Adapter/connector code calling third-party APIs
   is close to the audit's own "known technology categories individually"
   concern — elevating it to an A–F peer would put the weakest, most likely
   -obvious element at the same tier as the others. But claims 1 and 6 both
   depend on it structurally ("across at least two heterogeneous systems"),
   so it needs *a* name rather than none. Proposed term: **"the adapter
   layer,"** documented as part of D's orchestration mechanism, not
   independently claimed.

## Not open — excluded by design

**`CredentialCipher` (AES-256-GCM credential sealing) is infrastructure, not
an invention mechanism.** It doesn't map to any claim or family because
standard authenticated encryption isn't novel subject matter — flagging this
explicitly so it doesn't get pulled into a claim by accident just because it
lives in the same package as the mechanisms that are genuinely novel.

## Status

**Confirmed by founder sign-off, 2026-09-07 — all three resolutions adopted
as proposed, no overrides.** See the Approval section in
[`01-invention-lock.md`](./01-invention-lock.md). These remain
technical/organizational recommendations, not a legal determination —
counsel should still review before relying on them.
