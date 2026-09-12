# SILAS — Patent Claim & Mechanism Map

*Working claim architecture | not legal advice | v1.0*

*(Verbatim source document from the SILAS Execution Pack.)*

## Current draft claim architecture

| Claim | Mechanism | Evidence to build | Search target |
|---|---|---|---|
| 1 | Integrated system: isolated context + sanitization + finite/non-finite state arbitration + Saga inverse recovery + two-phase settlement + cryptographic ledger | Full end-to-end reference implementation and trace | Prior art combining these elements |
| 2 | Closed Shadow DOM / encapsulated overlay | Browser prototype showing host-DOM non-interference | Browser extension/overlay/RPA patents |
| 3 | Asynchronous IPC boundary without host coordinate intersection | Runtime message trace + isolation tests | Cross-app UI orchestration / IPC |
| 4 | Pre-flight relational health check before execution | Deterministic validator + failure threshold tests | Workflow preflight / data-quality orchestration |
| 5 | SSO + FIDO2/WebAuthn attestation | Testable approval flow and cryptographic verification | Enterprise approval/authentication |
| 6 | Method: contextual monitoring → sanitization → lease/CRDT arbitration → two-phase settlement → inverse recovery → commit/audit | Golden-path and failure-path test suite | Distributed Saga / compensation / payment rollback |
| 7 | External read-only verification portal | Independent verifier checks hash-chain continuity without database access | Tamper-evident audit / external verification |

## Recommended claim-family strategy

- Core family: deterministic heterogeneous orchestration + explicit inverse
  recovery.
- State family: finite-resource cryptographic leases paired with CRDT
  metadata convergence.
- Boundary family: isolated contextual client interface + local
  sanitization.
- Settlement/audit family: reversible pre-settlement state + human
  attestation + cryptographic evidence chain.
- Keep cleaning, healthcare, robotics, finance, and other verticals as
  embodiments unless a vertical-specific mechanism itself proves inventive.

## Claim drafting rules

1. Claim concrete relationships between components, not business outcomes.
2. Define inputs, state transitions, data structures/tokens, and outputs
   wherever possible.
3. Do not rely on unsupported performance numbers unless experimentally
   demonstrated.
4. Do not claim regulatory compliance merely because the architecture
   contains a related control.
5. Keep terminology identical across claims, specification, figures, API
   contracts, and prototype.
6. Maintain fallback dependent claims for each major mechanism so the
   entire application is not dependent on the broadest combination.

## Prototype evidence matrix

| Mechanism | Minimum proof | Success criterion |
|---|---|---|
| Context boundary | Host app + SILAS overlay test | Overlay operates without prohibited host-DOM dependency. |
| Sanitization | Synthetic PII/payment test harness | Sensitive values are transformed before egress. |
| Lease arbitration | Two offline clients competing for one finite asset | Only the valid lease holder can consume/commit the asset. |
| CRDT metadata | Two offline clients editing non-finite metadata | Changes converge after reconnection. |
| Inverse Saga | Injected downstream API failure | Prior committed-capable steps are returned to defined reversible state. |
| Two-phase settlement | Sandbox payment + ledger | No final settlement occurs before required verification. |
| Audit chain | Independent verifier | Hash continuity detects alteration. |
