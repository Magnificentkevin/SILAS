# SILAS Patent Counsel Packet

Assembled 2026-09-07, against the 90-Day Execution Board's Weeks 3–4
requirement: *"Prepare counsel packet: invention definition, claim map,
figures, prototype plan, inventorship/ownership questions."*

**Nothing in this packet is approved or legally reviewed.** Every document
below either says "DRAFT" explicitly or is a verbatim reproduction of source
material that was itself never marked approved. This packet's job is to give
counsel a complete, organized starting point — not to represent that the
patent-track work is finished.

## Contents, mapped to what the board asked for

| Board's ask | Document(s) | Status |
|---|---|---|
| Invention definition | [`01-invention-lock.md`](./01-invention-lock.md) (frozen version) + [`source/authoritative-invention-definition.md`](./source/authoritative-invention-definition.md) (original) | **APPROVED 2026-09-07 — all 3 vocabulary gaps resolved and signed off, no overrides** |
| Claim map | [`source/patent-claim-mechanism-map.md`](./source/patent-claim-mechanism-map.md) + [`00-terminology-crosswalk.md`](./00-terminology-crosswalk.md) (reconciles it against the audit and MVP spec) | Draft — claim map itself is source material; crosswalk is new analysis |
| Figures | [`figures/system-flow.mmd`](./figures/system-flow.mmd) (original), [`figures/mvp-module-architecture.mmd`](./figures/mvp-module-architecture.mmd) (derived) | Present — render with any Mermaid-compatible viewer |
| Prototype plan | [`source/mvp-technical-specification.md`](./source/mvp-technical-specification.md) (the plan) + [`04-prototype-status.md`](./04-prototype-status.md) (what's actually built and tested, as of this date) | Plan is source material; status is a factual, dated snapshot |
| Inventorship/ownership questions | [`05-inventorship-ownership-questions.md`](./05-inventorship-ownership-questions.md) | **Answered by the founder 2026-09-07** — solo inventorship, no prior agreements or disclosure, personal ownership. Not yet counsel-reviewed. |

## Supporting material not explicitly requested by the board, but relevant

- [`02-mechanism-decision-memo.md`](./02-mechanism-decision-memo.md) — why
  families C, D, E are the priority order.
- [`03-prior-art-search-matrix.md`](./03-prior-art-search-matrix.md) — a
  first-pass public search (not a legal sufficiency opinion) against C, D, E
  and their combination. Flags `AuditVault`'s prior art
  (EP2897051A2 / US9338013B2) as the single closest match found — the first
  thing worth putting in front of counsel.
- [`source/patent-core-audit.md`](./source/patent-core-audit.md) — the
  original audit that set this whole track's priorities; useful context for
  why the packet is organized this way.

## Status of the three vocabulary gaps

Per `00-terminology-crosswalk.md`, each is resolved and signed off by the
founder (2026-09-07, no overrides) in `01-invention-lock.md`:

1. Pre-flight health check (claim 4 / MVP module 04) → **proposed as a new
   Family F**, not folded into B.
2. SSO/FIDO2 attestation (claim 5 / MVP module 01) → **proposed folded into
   Family E** (its own definition already names "verified approval").
3. External system adapters → **proposed named as a supporting component of
   Family D**, not a peer family.

## Not for counsel

Two Word files live in this folder that are **not** part of the packet and
should be excluded if this folder is ever shared or copied wholesale:

- `counsel-outreach-letter.docx` — a Word copy of the letter already sent to
  Washington Patent Services (see
  [`../legal/counsel-outreach-draft.md`](../legal/counsel-outreach-draft.md)
  for the source). Reference material, not part of the invention packet.
- `Query.docx` — a Word export of an internal Claude Code session discussing
  the terminology-crosswalk resolutions ahead of P01's approval. Not a legal
  or technical document; kept only as a record of that discussion.

## Reading order suggestion for counsel

1. `01-invention-lock.md` (what SILAS is claimed to be)
2. `source/patent-claim-mechanism-map.md` + `00-terminology-crosswalk.md`
   (the claims, and where the vocabulary needs a decision)
3. `04-prototype-status.md` (what's actually running, vs. planned)
4. `03-prior-art-search-matrix.md` (what's already out there)
5. `05-inventorship-ownership-questions.md` (already answered by the
   founder — the two items flagged inline are what to confirm on the call)
