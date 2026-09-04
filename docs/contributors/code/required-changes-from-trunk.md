# Required changes from trunk

The `Required changes from trunk` status check ensures open pull requests contain the latest required repo-wide infrastructure changes from `trunk` (toolchain bumps like a Node.js upgrade, or repo-wide formatting and linting changes) before they can be merged. This prevents a pull request based on an older commit from passing CI against an outdated toolchain or reintroducing old-style code.

## How it works

A movable lightweight git tag, `required-trunk-baseline`, points at the last `trunk` commit that every open pull request must contain. The check passes when the tagged commit is an ancestor of the pull request head, and fails otherwise. While the tag does not exist, nothing is required and the check passes.

The tag moves only through explicit maintainer intent, in one of two ways:

-   Dispatching the `Required changes from trunk` workflow with `move-baseline: true`, or
-   Merging a pull request that carries the `Require PR update` label.

When the tag moves, the workflow sweeps every open pull request and posts the status each one now warrants, subject to the limits below. Pull requests already carrying the current verdict are left alone, so a repeated sweep is cheap. Drafts are swept too, so a draft is accurate the moment it is marked ready for review.

## Limits

The sweep that follows a baseline move is intentionally bounded:

-   Each run writes at most 400 statuses. Evaluating and stamping one pull request costs two REST requests, so a full run uses about 800 of the 1,000 per hour the workflow token is allowed. A run that hits the cap, is rate limited, or fails a write exits nonzero; dispatch again with `sweep: true` about an hour later, and repeat until a run finishes cleanly.
-   Retries use `sweep: true`, never `move-baseline: true`. Moving the baseline again would re-invalidate everything the previous runs stamped, and a sweep that takes several hours would never catch up with a moving `trunk`.
-   A pull request checked at the exact moment the baseline moves can briefly keep an outdated status; it converges on the pull request's next event or the next dispatch.
-   A pull request opened while the workflow is broken carries no status at all, and shows as "Expected", which also blocks merging. The next sweep or its own next update gives it a real one.

## My pull request has a red "Required changes from trunk" status. What do I do?

Update your branch past the current baseline, using either method:

-   Merge the latest `trunk` into your branch, or
-   Rebase your branch onto the latest `trunk`.

Pushing the update re-runs the check and turns it green.

## The `Require PR update` label

Committers apply the `Require PR update` label to a pull request whose change invalidates all open pull requests, such as a toolchain bump or a repo-wide formatting change. When such a pull request merges, the baseline moves and all open pull requests must update. The label is detected cumulatively on every `trunk` push, so it still takes effect if workflow runs are coalesced.

## Maintainer runbook

The `Required changes from trunk` workflow exposes two `workflow_dispatch` switches. `move-baseline` moves the baseline tag to the current `trunk` HEAD and then sweeps open pull requests. `sweep` sweeps against the baseline where it stands, which is the retry path after an interrupted run and the way to bring every open pull request back to passing if the tag is ever deleted.

### Initial setup

The workflow blocks nothing until these one-time steps are completed, in order:

1. Create the `Require PR update` label.
2. Seed the baseline: dispatch the workflow with `move-baseline: true`. Every open pull request is stamped in the same run, or across repeated dispatches when the write cap is hit.
3. Re-dispatch with `sweep: true`, roughly hourly, until a run reports no writes, so that no pull request is left unstamped.
4. Ask a repository admin to add the `Required changes from trunk` commit status to the trunk ruleset's required status checks, not the `Report required trunk changes status` job that posts it, and to add a tag ruleset for `required-trunk-baseline` restricting creation, update, and deletion to the GitHub Actions app.

To roll the check back, remove `Required changes from trunk` from the required status checks; existing statuses become informational immediately. The tag can stay for a later re-enable.

The implementation lives in `tools/validation/required-trunk-changes/` and `.github/workflows/required-changes-from-trunk.yml`.
