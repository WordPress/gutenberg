# Collect and interpret evidence

Keep collection deterministic and analysis interpretive. Read [people.md](people.md) completely before weighing contributors. Prefer the live `gutenberg-core` team list when access permits; use the snapshot as fallback.

## Collect the discussion and implementation

For every shortlisted pull request, read:

-   the description and linked design context;
-   any issue explicitly linked from a pull request that remains a documentation candidate, including the relevant discussion and resolution;
-   issue comments and review summaries;
-   inline review threads, including resolved threads;
-   changed files and the final merged implementation;
-   follow-up, revert, and compatibility work when relevant.

## Weigh the evidence

-   Weight project leaders above maintainers on questions of direction and rationale.
-   Weight `gutenberg-core` maintainers above contributors outside that team.
-   Use merged history and CODEOWNERS only as secondary signals.
-   Treat bots as near-zero-trust authors.
-   Do not turn comment volume, reactions, or a merge alone into proof of consensus.
-   Treat the merged code as evidence of shipped behavior, not automatic resolution of every concern raised in discussion.

Record meaningful competing positions with their authors and trust tiers. If the discussion does not clearly resolve a disagreement, describe it neutrally rather than choosing a side. State what shipped separately from what remains uncertain.

Only call a question resolved when the discussion, final implementation, or a later authoritative decision clearly settles it. Preserve caveats that affect compatibility, follow-up work, or the safe scope of the guidance.

## Verify against the repository

Before proposing text:

1. Check the current implementation, tests, schemas, package READMEs, contributor docs, and existing instructions.
2. Confirm the proposed guidance is still true on the pull request base branch, not merely true in the release tag.
3. Look for later changes that narrow, revert, or supersede the release decision.
4. Prefer updating the canonical existing page over creating a parallel explanation.
5. Link claims to primary evidence.

## Choose the destination

-   Update user or contributor documentation for behavior, migration, compatibility, and supported API guidance.
-   Update `AGENTS.md` only for a durable engineering constraint that future feature or bug-fix work should consistently apply.
-   Put a package-specific durable constraint in the affected package's nearest `AGENTS.md`. If that package has no instruction file and the evidence requires package-scoped guidance, create `packages/<package>/AGENTS.md` with only the focused guidance instead of promoting it to the repository root.
-   Update `.github/copilot-instructions.md` only when the same durable constraint is useful to repository-wide coding assistance.
-   Do not add instruction-file text for a release status, a single implementation choice, unresolved design preference, or guidance already expressed adequately in canonical docs.
