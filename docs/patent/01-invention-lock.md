# SILAS Invention Lock

**Status: APPROVED — 2026-09-07.** Per the 90-Day Execution Board (task P01,
due 2026-09-11), exit evidence is "approved single source of truth." The
founder has reviewed and confirmed all three proposed resolutions in
[`00-terminology-crosswalk.md`](./00-terminology-crosswalk.md) (a new
Family F, attestation folded into E, the adapter layer named as part of D)
as-is, with no overrides. This document is now frozen per the terms in
"What 'frozen' means from here forward" below.

## Working invention statement

SILAS is a distributed computing architecture for safely orchestrating
stateful operations across heterogeneous enterprise systems, combining:

- isolated contextual interaction (**family A**),
- client-side data minimization (**family B**),
- deterministic relational/data-health validation before execution
  (**family F**),
- deterministic coordination of finite and non-finite state (**family C**),
- explicit inverse recovery of failed downstream operations across
  heterogeneous systems, via an adapter layer (**family D**, including the
  adapter layer as a supporting component),
- controlled transaction settlement with human attestation as the verified-
  approval mechanism (**family E**, attestation folded in), and
- cryptographically verifiable audit state (**family E**).

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

*(Unchanged from the original Authoritative Invention Definition — this
document doesn't relitigate it, only ties it to canonical family names.)*

## North-star test

If a proposed feature does not strengthen the invention, demonstrate the
core technical mechanism, create measurable commercial proof, or enable a
required embodiment, it does not belong in the current build.

## What "frozen" means from here forward

Once approved, every future document — specification, figures, claims,
prototype code, marketing copy that touches the mechanism — refers to these
mechanisms only by their family letter (A–F) and the canonical name above,
not by any of the module numbers, claim numbers, or ad hoc names the source
documents used independently. New mechanisms discovered during engineering
get a new family letter and a crosswalk entry, not a silent rename of an
existing one.

## Approval

- [x] Founder has reviewed this statement and the three proposed resolutions
      in the terminology crosswalk.
- [x] Founder has confirmed each proposed resolution (or overridden it).
- [x] This document is marked APPROVED with a date, and treated as
      immutable from that point — changes require a new dated revision, not
      an edit in place.

**APPROVED — 2026-09-07.** All three vocabulary resolutions confirmed as
proposed, no overrides. Future changes require a new dated revision, not an
edit to this one.
