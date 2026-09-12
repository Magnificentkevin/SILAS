# SILAS — Patent Core Audit

*Decision document | v1.0 | 06 Sep 2026*

*(Verbatim source document from the SILAS Execution Pack.)*

## Executive decision

The project is close to a coherent patent program, but the current
disclosure is broader than the project needs and mixes several technical
mechanisms. The next move is consolidation, not feature expansion. The
patent should be treated as the primary asset; SILAS is the first commercial
embodiment and proving ground.

## What the current corpus already establishes

- An explicit technical architecture for orchestration across heterogeneous
  third-party systems.
- An isolated client-side interaction boundary using an out-of-process/
  composited overlay or closed Shadow DOM concept.
- Client-side volatile-memory sanitization/tokenization before network
  egress.
- Offline synchronization that separates non-finite metadata convergence
  (CRDTs) from finite physical-resource contention (pessimistic,
  time-bounded cryptographic leases).
- An event-driven Saga model with concrete inverse API mutations for
  failure recovery.
- A two-phase financial state model using an authorization hold, staged
  journal entry, human verification, and final settlement.
- An append-only cryptographic audit structure binding transaction/state/
  attestation evidence.

## Candidate inventive mechanism families

| Family | Technical mechanism | Why it matters | Priority |
|---|---|---|---|
| A — Context boundary | Route-aware isolated overlay + IPC without host DOM mutation | Defines a concrete ingress/interaction architecture for heterogeneous host applications. | High |
| B — Data boundary | Volatile-memory sanitization/tokenization + payment-entry isolation | Creates a technical privacy boundary before egress. | High |
| C — Offline resource arbitration | CRDTs for non-finite state + cryptographic pessimistic leases for finite assets | Addresses a specific split-brain/resource-contention problem. | Very high |
| D — Deterministic recovery | Saga orchestration + explicit inverse API mutations | Turns downstream failure into deterministic state recovery. | Very high |
| E — Controlled settlement/audit | Pre-auth hold + staged ledger + verified approval + chained cryptographic record | Creates a transaction-control sequence with auditable state transitions. | Very high |

## Primary patent risk

- The combination may contain multiple inventions rather than one
  indivisible invention.
- Several components are known technology categories individually;
  novelty/non-obviousness depends on the claimed combination and specific
  implementation relationships.
- Some regulatory assertions in the source material are stronger than the
  technical disclosure supports and should be removed or qualified until
  counsel validates them.
- Thresholds and terminology are not perfectly consistent across documents;
  the specification, figures, claims, and implementation plan must use one
  vocabulary.
- The current draft contains broad legal conclusions about patent
  eligibility, FTO, PCI-DSS, SOX, FDA Part 11, and international priority
  that should be treated as counsel questions, not established outcomes.

## Audit actions — do these before expanding the build

1. Freeze the invention vocabulary and component numbering.
2. Identify the single strongest technical problem/solution pair.
3. Run a targeted prior-art search against each mechanism family and
   especially the combination of C+D+E.
4. Create claim charts showing the exact structural relationship among the
   components.
5. Have patent counsel decide whether to pursue one core application plus
   continuation/divisional families.
6. Prototype the hardest-to-prove mechanisms: offline finite-resource
   leasing, deterministic inverse recovery, and cryptographic state binding.
7. Remove unsupported regulatory/legal conclusions from the patent
   narrative.

## Go / no-go gates

| Gate | Pass condition |
|---|---|
| Invention lock | One paragraph defines the invention without mentioning the cleaning business. |
| Novelty gate | Prior-art results are mapped against each candidate mechanism and combination. |
| Claim gate | Counsel can identify defensible independent-claim scope and fallback positions. |
| Prototype gate | At least one reproducible runtime trace demonstrates the core technical sequence. |
| Filing gate | Specification, figures, inventorship, ownership, and filing strategy are counsel-reviewed. |
