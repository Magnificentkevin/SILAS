# SILAS — MVP Technical Specification

*Build only the invention spine | v1.0*

*(Verbatim source document from the SILAS Execution Pack.)*

## MVP objective

Build one production-shaped workflow that proves the invention end-to-end.
The MVP is a reference implementation, not the final enterprise platform.

## Reference runtime

Context/event → isolated client boundary → local sanitization → pre-flight
validator → orchestration/Saga engine → resource lease service → external
system adapters → reversible payment/ledger staging → human verification →
commit → cryptographic audit.

## Recommended stack

| Layer | MVP choice | Reason |
|---|---|---|
| Web client | Next.js + TypeScript | Fast reference implementation and operator UI. |
| API | NestJS/Fastify + TypeScript | Matches existing architecture and supports modular services. |
| Database | PostgreSQL | Reliable transactional state and audit metadata. |
| Offline client | React Native/Expo + SQLite | Tests intermittent-connectivity embodiment. |
| Contracts | Zod/TypeScript schemas | One source of truth for messages and state. |
| Events | Postgres-backed outbox first; broker later | Avoid premature infrastructure complexity. |
| Crypto | Standard audited primitives/library | Do not invent cryptography. |
| Payments | Sandbox payment provider | Demonstrate two-phase authorization/settlement safely. |
| Auth | SSO + WebAuthn/FIDO2 for approval path | Demonstrates the attestation boundary. |

## MVP modules

01 Auth/RBAC — operator, verifier, administrator.
02 Context Adapter — route/context event ingestion.
03 Sanitization Engine — deterministic sensitive-token transformation.
04 Pre-Flight Engine — relational/data-health checks.
05 Resource Lease Service — signed, expiring leases for finite assets.
06 Metadata Sync — CRDT-backed non-finite field state.
07 Saga Engine — ordered actions, state machine, retries, inverse mutations.
08 Settlement Service — authorization hold + staged journal state +
verification.
09 Audit Vault — append-only hash-linked events.
10 Operator Console — current state, failures, approvals, audit trace.

## Golden-path demo

1. Operator opens a supported enterprise workflow.
2. Context adapter identifies the operational object/route.
3. Local sanitizer transforms sensitive fields.
4. Pre-flight validator confirms required records.
5. Finite resources receive time-bounded leases.
6. SILAS executes adapter actions across at least two heterogeneous systems.
7. Payment is placed in sandbox authorization hold and accounting remains
   staged.
8. Authorized verifier approves the transaction.
9. SILAS captures/commits and seals the final state in the audit chain.

## Failure-path demo

1. Inject a deterministic failure after one or more downstream actions.
2. Saga engine records the failed state.
3. Inverse adapter sends explicit cancellation/de-allocation operations.
4. Payment authorization is released before settlement.
5. Finite resource lease is released/expired according to policy.
6. Audit chain records the failure and compensating actions.
7. Operator sees a final RECOVERED or BREACH_RECOVERY state.

## Out of scope for MVP

- Robotic autonomy.
- Autonomous vehicle dispatch.
- Dozens of external integrations.
- Full ERP/CRM/FSM replacement.
- Complex AI/VLA layer.
- Nationwide compliance programs.
- Large-scale customer marketplace.
- Anything that does not help prove the patent mechanism.
