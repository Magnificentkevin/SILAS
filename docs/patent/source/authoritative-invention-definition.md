# SILAS — Authoritative Invention Definition

*Single source of truth | v1.0 | 06 Sep 2026*

*(Verbatim source document from the SILAS Execution Pack — reproduced here so
it lives in version control alongside the rest of the counsel packet, not
only in the original zip file.)*

## Working invention statement

SILAS is a distributed computing architecture for safely orchestrating
stateful operations across heterogeneous enterprise systems by combining
isolated contextual interaction, client-side data minimization, deterministic
coordination of finite and non-finite state, explicit inverse recovery of
failed downstream operations, controlled transaction settlement, and
cryptographically verifiable audit state.

## Technical problem

Enterprise workflows frequently span applications with different interfaces,
APIs, data models, connectivity conditions, transaction semantics, and
authority boundaries. A failure or synchronization conflict in one system can
leave other systems in partially committed or contradictory states. The
invention addresses that problem by introducing explicit boundaries and
deterministic state-transition controls rather than relying on screen
scraping, blind retries, eventual convergence for scarce resources, or
charge-and-refund recovery.

## Core mechanism

1. Detect contextual state/route at the client boundary without requiring
   modification of the host application's render tree.
2. Sanitize sensitive data in volatile client memory before transmission and
   isolate payment-entry handling.
3. Represent non-finite operational metadata with convergent replicated state
   while reserving pessimistic, signed, expiring leases for finite physical
   resources.
4. Execute a deterministic event-driven orchestration sequence across
   heterogeneous APIs.
5. Before final settlement, keep payment and accounting state reversible and
   uncommitted.
6. When a downstream step fails, invoke explicit inverse mutations that
   return prior systems to a defined recoverable state.
7. Require authorized verification before final commitment.
8. Seal the resulting transaction/state/attestation evidence into a
   tamper-evident cryptographic chain.

## What the invention is NOT

- Not merely a cleaning-management application.
- Not merely an AI agent, CRM, ERP, FSM, payment application, or scheduling
  application.
- Not merely a browser overlay.
- Not merely a Saga implementation.
- Not merely CRDT synchronization.
- Not merely a cryptographic audit log.
- Robotics is an embodiment/extension, not a prerequisite for the core
  invention.

## Preferred embodiments

| Embodiment | Purpose |
|---|---|
| Enterprise web workflow | Demonstrates contextual orchestration across existing SaaS applications. |
| Field/mobile workflow | Demonstrates intermittent connectivity and finite physical-resource leasing. |
| Service operation | Uses SILAS in All Business Cleaning as a real-world proving environment. |
| Robotic operation | Extends finite-resource, telemetry, orchestration, and verification mechanisms to machines/fleet assets. |
| Regulated/controlled workflow | Demonstrates cryptographic evidence and human-authorized settlement where applicable. |

## North-star test

If a proposed feature does not strengthen the invention, demonstrate the core
technical mechanism, create measurable commercial proof, or enable a required
embodiment, it does not belong in the current build.
