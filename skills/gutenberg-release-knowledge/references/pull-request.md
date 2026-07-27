# Prepare the pull request

Keep the change small and reviewable. Prefer one coherent topic over a release-wide grab bag.

Before editing handbook documentation or a package README, read [the documentation contribution guide](../../../docs/contributors/documentation/README.md) and follow its Markdown, heading, link, code-fence, and callout conventions. Also inspect the destination file and any closer instructions for local patterns.

Match the destination file's existing source formatting. Do not hard-wrap new prose at an arbitrary column or reflow unchanged prose. Inspect the final diff for avoidable mid-sentence line breaks.

## Describe the proposal

Use a concise pull request description:

```markdown
## What?

<What documentation or instructions changed.>

## Why?

<The gap and the release evidence that exposed it.>

## Discussion

This is a release-learning proposal, not a settled conclusion. Please challenge the evidence, scope, wording, or destination. Closing this PR is a useful outcome if the guidance is not durable or correct. Discussion here will be used to improve this skill.
```

Include direct evidence links without turning the pull request body into the full analysis report. Open the pull request ready for review, never merge it, and keep it in the user-specified fork when requested.

## Add labels and reviewers

1. Query the target repository's current labels. Select the smallest set of existing labels that describes the proposed change, using labels from the source pull requests as evidence when they still fit. Never create a label just for the generated pull request.
2. Tag the people whose substantive discussion, review, or authored rationale directly informed the proposal alongside the corresponding evidence links in the pull request body.
3. Request reviews only from those named evidence participants. Exclude bots, reaction-only participants, passive requested reviewers, broad props lists, and people whose comments did not inform the proposal. When several people support the same point, keep the list focused on those whose rationale most directly informed the proposal.
4. Apply the selected labels and request the evidence-linked reviewers after opening the pull request.
5. Verify the labels and review requests. If repository permissions or collaborator rules prevent either action, keep the relevant people tagged in the pull request body and report the intended labels or reviewers with the exact limitation.

## Validate

-   Run `npm run format -- <changed Markdown files>` and `npm run lint:md:docs -- <changed Markdown files>` for documentation changes, then inspect the resulting diff and reject unrelated reflow. Do not format untouched files.
-   Run other formatting or lint checks scoped to changed files when applicable.
-   Distinguish new failures from pre-existing warnings.
-   Confirm the pushed branch and ready-for-review status.
