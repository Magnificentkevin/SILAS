# Inventorship & Ownership — Questions and Answers

**Status: answered by the founder on 2026-09-07, not yet reviewed by
counsel.** These are factual and legal determinations — the answers below
are the founder's own factual statements, not a legal conclusion. Counsel
should still review each one; several have a specific follow-up flagged
inline where the founder's fact pattern raises a question only counsel can
resolve (financing trade-offs, exact disclosure wording, etc.).

## Conception

1. For each of the five mechanism families (A–E), who first conceived the
   specific technical approach — not just "the idea of orchestration," but
   the specific mechanism (e.g., pairing CRDTs with cryptographically-signed
   pessimistic leases for family C)? Was any family conceived jointly with
   someone else?

   > **Answer (2026-09-07):** Founder conceived all five families solo.

2. Did anyone besides you contribute an inventive concept at any point — a
   co-founder, an engineer, a contractor, an advisor — even informally, even
   in a conversation that didn't result in code?

   > **Answer (2026-09-07):** No — solo conception, no joint contribution.

## Employment and prior agreements

3. Was any part of the invention conceived while you (or any contributor)
   were employed elsewhere? Does that employer's agreement include an IP
   assignment or "shop rights" clause that could reach work conceived on
   personal time?

   > **Answer (2026-09-07):** No external employer — founder owns All
   > Business Cleaning, and the invention was conceived through running
   > that business, leading to a decision to redirect the company from
   > labor services toward software. No third-party employer IP-assignment
   > conflict exists.
   >
   > **Resolved by question 9 below:** founder wants personal ownership,
   > not through All Business Cleaning or any new entity — so the "which
   > entity should own it" question doesn't apply. Still worth a quick
   > counsel check on one thing this fact pattern raises: does All Business
   > Cleaning's own formation documents (articles, operating agreement)
   > contain language that could claim IP conceived "in the course of" the
   > business, regardless of the founder's intent to hold it personally?
   > That's a document-review question, not a preference question.

4. Do any contractors who touched this codebase — including whoever built
   the original monorepo scaffold and the five source documents in the
   Execution Pack before this session — have signed IP-assignment /
   work-for-hire agreements? If not, their contributions may need
   retroactive assignment before filing.

   > **Answer (2026-09-07):** No contractors — founder built the original
   > scaffold and source documents solo. No third-party contribution to
   > track down or assign.

## Prior disclosure

5. Has the invention (any of families A–E specifically, not just "SILAS" as
   a product name) been discussed with anyone outside the company without an
   NDA in place — investors, advisors, an accelerator, a potential customer,
   a contractor pitch?

   > **Answer (2026-09-07):** No — no disclosure to any outside party.

6. **Specific to this project:** the Execution Pack's source material
   references conversations in ChatGPT and Gemini about SILAS (one Gemini
   session's sidebar, visible in a screenshot taken this session, shows
   titles like "SILAS Case Engineering Product" and several other
   SILAS-related chat entries). Third-party AI tools' terms of service vary
   on whether prompts/outputs are used for model training or could be
   surfaced to other users — this is worth specifically asking counsel
   about as a potential prior-disclosure or confidentiality question, not
   something to assume is fine or assume is a problem.

   > **Answer (2026-09-07):** Founder alone, brainstorming with the AI
   > tools — not shared with another human being. Still worth raising with
   > counsel per the note above (a solo AI conversation isn't the same
   > question as "was this told to a person," and the tools' own terms of
   > service are the open variable, not what the founder did).
7. Is there any public repository, blog post, pitch deck, or demo video
   describing any mechanism family in enough technical detail to count as
   disclosure? (The GitHub repository created this session is private and
   was verified private both before and after every push — but it's worth
   confirming no earlier, separate copy of this code was ever made public.)

   > **Answer (2026-09-07):** No mechanism-level disclosure. Public-facing
   > mentions were limited to "building a piece of software" in general —
   > the specific mechanics (families A–F) were never described publicly.
   > Worth a quick counsel read on where exactly that line sits (a vague
   > "I'm building software" statement is generally not an enabling
   > disclosure, but the precise wording used is the kind of detail counsel
   > should confirm rather than assume).

## AI-assisted development

8. A substantial share of this session's engineering (the `packages/silas-core`
   prototype, the API, both frontend apps) was written by Claude, an AI
   coding assistant, under your direction. USPTO guidance holds that AI
   cannot be a named inventor, but doesn't categorically disqualify human
   inventorship where a natural person conceived the invention and used AI
   as a tool for implementation — the same way using a compiler or a
   contractor-written library doesn't. Worth confirming with counsel that
   the actual conception (the choice of mechanisms, their combination, the
   decision that C+D+E is the patentable core) originated with you, since
   that's what inventorship turns on — not who typed the code.

   > **Answer (2026-09-07):** Confirmed — Claude was implementation-only, used
   > to increase productivity and expedite development. All conception
   > (the mechanisms, their combination, the C+D+E prioritization)
   > originated with the founder.

## Ownership entity

9. Is there a formed company entity intended to own this patent, or is
   ownership currently personal? If an entity exists or will exist, has IP
   been (or will it be) formally assigned to it? This affects both the
   patent application's assignee field and any future financing.

   > **Answer (2026-09-07):** Personal ownership — founder wants to hold
   > the patent individually, not through All Business Cleaning or any new
   > entity. Solo endeavor, no co-founders or other owners involved.
   >
   > Worth raising with counsel specifically: personal ownership is
   > simpler now, but affects future financing (many investors expect IP
   > to sit inside the company they're investing in, which would mean an
   > assignment-and-license-back arrangement later rather than starting
   > there) and liability separation (a patent held personally isn't
   > shielded by any entity's liability protection). Neither is a reason to
   > change the answer now — just worth knowing the trade-off going in.

## Summary for counsel intake

- **Inventorship:** solo — founder conceived all mechanism families alone,
  no joint contributors, no contractors touched the codebase or source
  documents. Claude (AI) was implementation-only.
- **Prior agreements:** none — no external employer, no contractor
  agreements to chase down.
- **Prior disclosure:** none at the mechanism level. General "building
  software" statements were made publicly; the specific mechanics were not.
  Worth confirming the exact wording used doesn't cross into enabling
  disclosure.
- **AI-assisted development:** implementation tool only, conception was the
  founder's — matches the fact pattern USPTO guidance treats as not
  disqualifying human inventorship.
- **Ownership:** personal, not through any entity — flagging the financing
  and liability trade-offs that come with that choice, and one document
  -review item (All Business Cleaning's own formation documents, in case
  they contain IP-claiming language that could reach this regardless of
  intent).

## Recommendation

This is now a complete first-pass record, not an open checklist — bring it
to the first call with counsel as-is. The two items worth counsel's specific
attention are flagged inline above: the exact wording of any public "I'm
building software" statement, and a quick read of All Business Cleaning's
formation documents.
