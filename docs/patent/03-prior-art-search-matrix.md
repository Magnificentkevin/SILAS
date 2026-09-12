# Prior-Art Search Matrix

**Status: DRAFT — first pass, not legal sufficiency.** 90-Day Execution
Board task P03 (due 2026-09-25), exit evidence "prior-art matrix." This is a
starting point built from public search (Google Patents, USPTO full-text,
arXiv) to give counsel a running start — it is explicitly **not** a
freedom-to-operate opinion or a novelty determination. Only patent counsel
can make either of those calls. Searched in priority order per the
[mechanism decision memo](./02-mechanism-decision-memo.md): C, then D, then
E, then the C+D+E combination directly.

## Family C — Offline resource arbitration (CRDTs + cryptographic pessimistic leases)

**Search terms used:** CRDT + cryptographic lease + finite resource
arbitration; pessimistic lock/lease, time-bounded, expiring, offline
synchronization, distributed systems.

| Reference | What it covers | How SILAS's claim differs (first pass) |
|---|---|---|
| [US20170024451A1](https://patents.google.com/patent/US20170024451A1/en) — CRDT arrays in a datanet | CRDT-based array replication for general data storage | Covers CRDTs alone, with no finite-resource lease counterpart — doesn't address the specific split between finite and non-finite state that's the actual claim |
| [US12468682](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12468682) — Conflict-free graphs of distributed data structures | CRDT-based synchronization for concurrent data updates | Same gap — non-finite state synchronization only, no pessimistic lease mechanism for finite/exclusive resources |
| [US11392576B2](https://patents.google.com/patent/US11392576B2/en) — Distributed pessimistic lock (HBase) | Pessimistic locking via a centralized lock manager on HBase | Storage-infrastructure-specific (HBase RegionServer), not paired with CRDT metadata sync, no cryptographic signing of the lease itself |
| [US9575985B2](https://patents.google.com/patent/US9575985B2/en) / [US20110137879A1](https://patents.google.com/patent/US20110137879) — Distributed lock administration | Two-tier lock manager with renewable, time-bound leases | Closest on the leasing mechanics (TTL, renewal, expiry-on-failure) — but no cryptographic signature binding the lease to a specific holder/resource, and no CRDT counterpart for non-finite state |
| Academic: [Secure CRDTs](https://eprint.iacr.org/2020/944), [Process-Commutative Distributed Objects](https://arxiv.org/pdf/2311.13936) | Cryptographic augmentation of CRDTs themselves (encrypted operations) | Different problem — securing the CRDT's *contents*, not arbitrating a *separate class* of finite, non-mergeable resources alongside it |

**First-pass read:** the CRDT side (non-finite metadata) and the
cryptographically-signed lease side (finite resources) each have close,
independent prior art. **No reference found treats them as two halves of one
arbitration mechanism** — that pairing, specifically, is where novelty is
most plausible and where counsel should look hardest.

## Family D — Deterministic recovery (Saga + explicit inverse mutations)

**Search terms used:** saga pattern, distributed transaction, compensating
action, inverse mutation; orchestration engine + resource + audit.

| Reference | What it covers | How SILAS's claim differs (first pass) |
|---|---|---|
| [US8275793B2](https://patents.google.com/patent/US8275793) — Transaction transforms | Compensating actions for optimistic-concurrency data-connector transactions | General compensation concept, not tied to a specific finite-resource-lease + CRDT state model as the thing being compensated |
| **Cadence / Temporal** (industry system, not a patent) — [cadenceworkflow.io](https://cadenceworkflow.io/docs/use-cases/orchestration) | Production workflow orchestration explicitly implementing Saga + compensation with retries | This is the closest **known-technology** reference — the Patent Core Audit's own risk #2 already flags Saga implementations as "known technology categories individually." SILAS's claim needs to rest on the specific combination with C and E, not the Saga mechanism alone |
| [US8356007B2](https://patents.google.com/patent/US8356007B2/en), [US11003689B2](https://patents.google.com/patent/US11003689B2/en) — Distributed transaction/database protocols | Multi-node commit protocols (2PC-style), not Saga-style compensation | Different recovery model (block-until-commit vs. commit-then-compensate) — likely distinguishable, lower risk |

**First-pass read:** matches the Patent Core Audit's existing risk
assessment — the Saga/compensation mechanism itself is well-established
(Cadence/Temporal are widely deployed). D's patentability depends on being
claimed as part of the C+D+E combination, not standalone.

## Family E — Controlled settlement/audit (pre-auth hold + staged ledger + verified approval + cryptographic chain)

**Search terms used:** two-phase payment authorization hold, staged ledger,
settlement verification; tamper-evident cryptographic hash chain, external
verification, audit log.

| Reference | What it covers | How SILAS's claim differs (first pass) |
|---|---|---|
| [US7431207](https://patents.google.com/patent/US7431207) — Two-step payment transaction authorizations | Classic authorization-hold-then-settlement card processing | Payment-specific, no cryptographic audit chain component, no connection to a resource-lease/Saga system |
| [US9704143B2](https://patents.google.com/patent/US9704143B2/en) — Cryptographic currency, two-phase commit | Two-phase commit for cryptocurrency wallet balance checks | Currency-balance-specific; not a general staged-ledger-plus-human-verification model |
| [US20220414807A1](https://patents.google.com/patent/US20220414807A1/en) — Net settlement via distributed ledger | Blockchain smart-contract hash matching for settlement agreement | Two-party hash-matching consensus model, not a single-system staged journal with an explicit human-verification gate before commit |
| [EP2897051A2](https://patents.google.com/patent/EP2897051A2/en), [US9338013B2](https://patents.google.com/patent/US9338013B2/en) — Verifiable (redactable) audit log | Hash-chained log entries, independently verifiable, selectively redactable | Very close on the audit-chain mechanics specifically — SILAS's `AuditVault` (append-only, hash-linked, independently re-verifiable) likely overlaps significantly here. **This is the reference to scrutinize hardest** — redactability is the one described feature SILAS doesn't have, which may or may not be enough of a distinction on its own |
| [US20100115284A1](https://patents.google.com/patent/US20100115284) — Tamper detection for a log of records | Proxy adds tamper-evidence via cryptographic signature per record subset | Signature-per-subset rather than hash-chained-per-entry; a real but narrower mechanical difference from `AuditVault`'s design |

**First-pass read:** the audit-chain half of E has the closest, most
specific prior art found in this pass (EP2897051A2 / US9338013B2) — flagging
this as the single highest-priority item for counsel to review before
relying on the audit chain as a standalone patentable element. The
settlement half (staged ledger + human verification gate specifically) has
weaker, more distant prior art.

## The C+D+E combination directly

**Search terms used:** orchestration engine + resource lease + saga +
cryptographic audit trail, combined.

No single reference was found combining all three mechanisms as one system.
[US10673775](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10673775)
("Orchestration engine using a blockchain for a cloud resource digital
ledger") is the closest — it pairs resource orchestration with a ledger —
and is worth a full read even though it doesn't appear to include Saga-style
inverse compensation.

## Summary for counsel intake

| Family | Closest prior art found | Apparent risk level |
|---|---|---|
| C (lease + CRDT combination) | None combining both halves | Lower — this pairing looks genuinely underexplored |
| D (Saga + inverse mutation) | Cadence/Temporal (known technology) | Higher standalone — needs the combination to carry novelty |
| E (audit chain specifically) | EP2897051A2 / US9338013B2 (verifiable redactable audit log) | Higher — closest match found in this entire search |
| E (settlement/staged ledger specifically) | US7431207, US9704143B2 (each partial) | Moderate |
| C+D+E combined | US10673775 (partial: resource + ledger, no Saga) | Lower — no full-combination reference found |

**Recommendation:** send this matrix to counsel with the audit-chain
references (EP2897051A2, US9338013B2) as the first thing to review — that's
where this pass found the closest match to something already built and
tested (`AuditVault`).
