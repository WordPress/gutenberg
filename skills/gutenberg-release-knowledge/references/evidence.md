# Collect and interpret evidence

Keep collection deterministic and analysis interpretive. Focus the investigation on finding important documentation gaps, not ranking contributors or proving every claim exhaustively.

## Collect the discussion and implementation

For every shortlisted pull request, read:

-   the description and linked design context;
-   any issue explicitly linked from a pull request that remains a documentation candidate, including the relevant discussion and resolution;
-   issue comments and review summaries;
-   inline review threads, including resolved threads;
-   changed files and the final merged implementation;
-   follow-up, revert, and compatibility work when relevant.

## Decide what matters

-   Prioritize gaps affecting public APIs, compatibility, recurring implementation mistakes, or behavior users and contributors need to understand.
-   Verify a candidate against the merged implementation, current documentation, and obvious follow-up work. If its validity remains ambiguous, record the uncertainty and move on rather than expanding the investigation.
-   Treat contributor roles as context about project direction, not proof that a claim is correct or agreed upon. Do not build trust tiers or reconstruct historical team membership.
-   Do not infer consensus from authority, comment volume, reactions, or a merge alone. Preserve meaningful disagreement and distinguish what shipped from what remains undecided.
-   Treat bot output as automation, not evidence of project intent unless it links to a human-authored decision.

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
