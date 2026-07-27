---
name: gutenberg-release-knowledge
description: Use when analyzing the pull requests and discussions shipped in a named stable Gutenberg release to identify durable guidance and prepare a focused documentation or instruction pull request.
---

# Gutenberg Release Knowledge

Turn one named stable Gutenberg release into a traceable, human-reviewed documentation proposal. Run locally; do not add release scheduling or publication automation unless the user explicitly asks for it.

## Confirm the scope

-   Require an explicit stable Gutenberg release number such as `23.6`; reject release candidates and other prereleases.
-   Ask where the proposed pull request should live if the repository, base branch, or fork is not specified.
-   Treat “no useful durable guidance found” as a valid result.
-   Preserve existing user changes and limit repository or fork maintenance to the scope the user authorizes.

## Follow the release-learning procedure

1. Read [references/release-set.md](references/release-set.md) and establish the exact shipped pull-request set.
2. Shortlist discussions that may contain reusable architectural, API, compatibility, data-contract, or styling guidance.
3. Read [references/evidence.md](references/evidence.md) before retrieving and interpreting the shortlisted discussions.
4. Verify each proposed conclusion against the current implementation and canonical documentation.
5. Choose the canonical documentation or instruction destination. Do not force an instruction-file change when the evidence does not justify one.
6. Read [references/pull-request.md](references/pull-request.md) before editing files or opening the proposal.

## Report the result

Summarize the selected guidance, unresolved disagreement, omitted candidates, changed destinations, and validation results. When no `AGENTS.md` or Copilot instruction change was made, explain why.
