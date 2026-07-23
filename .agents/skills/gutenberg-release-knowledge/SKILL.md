---
name: gutenberg-release-knowledge
description: Analyze the pull requests and discussions shipped in an explicitly named Gutenberg release, extract durable architectural and compatibility guidance, verify it against current code and documentation, and prepare a small draft pull request. Use for historical release-learning pilots, release knowledge reviews, documentation-gap analysis, and deciding whether release evidence justifies updates to docs, AGENTS.md, or Copilot instructions.
---

# Gutenberg Release Knowledge

Turn one named Gutenberg release into a traceable, human-reviewed documentation proposal. Run locally; do not add release scheduling or publication automation unless the user explicitly asks for it.

## Inputs and scope

- Require an explicit Gutenberg release number such as `23.6`.
- Ask where the draft PR should live if the user has not specified the repository, base branch, and fork.
- Keep collection deterministic and analysis interpretive.
- Treat “no useful durable guidance found” as a valid result.
- Read [references/people.md](references/people.md) completely before weighing contributors. Prefer the live `gutenberg-core` team list when access permits; use the snapshot as fallback.

## Prepare the repository

1. Check the worktree, current branch, remotes, and GitHub authentication.
2. Preserve user changes unless the user explicitly authorizes their removal.
3. Fetch the upstream default branch and relevant release tags.
4. Refresh a stale fork only to the scope the user authorized. Do not delete unrelated remote branches merely because the default branch is stale.
5. Create a dedicated topic branch from the requested base.

## Establish the release set

1. Resolve the stable tag `v<release>.0` and the preceding stable Gutenberg tag.
2. Extract commits and pull request numbers from the tag range.
3. Cross-check the set against the release milestone and published changelog.
4. Account for backports, release-branch-only commits, and pull requests represented by more than one commit.
5. Keep the release tag and the current default branch distinct. A shipped change may be absent, reverted, or superseded on the current branch.

For each candidate, retain the PR number, title, author, merge outcome, shipped commit, changed files, relevant discussion links, and release evidence.

## Select candidates

Prioritize discussions that may yield reusable guidance about:

- package and editor-layer boundaries;
- public, private, or compatibility APIs;
- block parsing, serialization, and data contracts;
- styles and `theme.json` behavior;
- backward compatibility and version-specific code;
- recurring implementation or review principles.

Deprioritize routine fixes, copy changes, generated updates, dependency bumps, and one-off implementation details unless their discussion reveals a broader rule.

Use titles, changed paths, labels, authors, and diffs to shortlist candidates before retrieving full conversations. Do not infer architectural guidance from titles alone.

## Collect and weigh evidence

For every shortlisted PR, read:

- the description and linked design context;
- any issue explicitly linked from the PR after the PR remains a documentation candidate, including its relevant discussion and resolution;
- issue comments and review summaries;
- inline review threads, including resolved threads;
- changed files and the final merged implementation;
- follow-up, revert, and compatibility work when relevant.

Apply these rules:

- Weight project leaders above maintainers on questions of direction and rationale.
- Weight `gutenberg-core` maintainers above contributors outside that team.
- Use merged history and CODEOWNERS only as secondary signals.
- Treat bots as near-zero-trust authors.
- Do not turn comment volume, reactions, or a merge alone into proof of consensus.
- Treat the merged code as evidence of shipped behavior, not automatic resolution of every concern raised in discussion.

## Preserve disagreement

Record meaningful competing positions with their authors and trust tiers. If the discussion does not clearly resolve the disagreement, describe it neutrally rather than choosing a side. State what shipped separately from what remains uncertain.

Only call a question resolved when the discussion, final implementation, or a later authoritative decision clearly settles it. Preserve caveats that affect compatibility, follow-up work, or the safe scope of the guidance.

## Verify against the repository

Before proposing text:

1. Check the current implementation, tests, schemas, package READMEs, contributor docs, and existing instructions.
2. Confirm the proposed guidance is still true on the PR base branch, not merely true in the release tag.
3. Look for later changes that narrow, revert, or supersede the release decision.
4. Prefer updating the canonical existing page over creating a parallel explanation.
5. Link claims to primary evidence.

## Choose the destination

- Update user or contributor documentation for behavior, migration, compatibility, and supported API guidance.
- Update `AGENTS.md` only for a durable engineering constraint that future feature or bug-fix work should consistently apply.
- Put a package-specific durable constraint in the affected package's nearest `AGENTS.md`. If that package has no instruction file and the evidence requires package-scoped guidance, create `packages/<package>/AGENTS.md` with only the focused guidance instead of promoting it to the repository root.
- Update `.github/copilot-instructions.md` only when the same durable constraint is useful to repository-wide coding assistance.
- Do not add instruction-file text for a release status, a single implementation choice, unresolved design preference, or guidance already expressed adequately in canonical docs.
- Do not force an instruction-file change to make the result appear more substantial.

## Prepare the draft PR

Keep the change small and reviewable. Prefer one coherent topic over a release-wide grab bag.

Use a concise PR description:

```markdown
## What?

<What documentation or instructions changed.>

## Why?

<The gap and the release evidence that exposed it.>
```

Include direct evidence links without turning the PR body into the full analysis report. Open the PR as a draft, never merge it, and keep it in the user-specified fork when requested.

Before opening the draft:

1. Query the target repository's current labels. Select the smallest set of existing labels that describes the proposed change, using labels from the source PRs as evidence when they still fit. Never create a label just for the generated PR.
2. Name the people whose substantive discussion, review, or authored rationale directly informed the proposal alongside the corresponding evidence links in the PR body.
3. Request reviews only from those named evidence participants. Exclude bots, reaction-only participants, passive requested reviewers, broad props lists, and people whose comments did not inform the proposal. Use the trust weighting above to keep the list focused when several people support the same point.
4. Apply the selected labels and request the evidence-linked reviewers after opening the draft. If the fork or repository permissions prevent either action, report the intended labels or reviewers and the exact limitation.

## Validate and report

- Run formatting or lint checks scoped to changed files when possible.
- Distinguish new failures from pre-existing warnings.
- Confirm the pushed branch and draft status.
- Summarize the selected guidance, unresolved dissent, omitted candidates, changed destinations, and validation result.
- Explicitly say why no `AGENTS.md` or Copilot instruction change was made when that is the outcome.
