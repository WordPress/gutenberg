# PR Freshness Check

The `PR is up to date` status check ensures open pull requests contain the latest repo-wide infrastructure changes from `trunk` (toolchain bumps like a Node.js upgrade, or repo-wide formatting and linting changes) before they can be merged. This prevents a pull request based on an older commit from passing CI against an outdated toolchain or reintroducing old-style code.

## How it works

A movable lightweight git tag, `infra-baseline`, points at the last `trunk` commit that every open pull request must contain. The check passes when the tagged commit is an ancestor of the pull request head, and fails otherwise.

The tag moves only through explicit maintainer intent, in one of two ways:

-   Dispatching the `PR freshness` workflow with `move-baseline: true`, or
-   Merging a pull request that carries the `Force PR refresh` label.

When the tag moves, open pull requests holding a now-outdated passing status are switched to failing, subject to the limits below.

## Limits

The sweep that follows a baseline move is intentionally bounded:

-   Draft pull requests are skipped; they cannot merge anyway and are re-checked when marked ready for review.
-   Each run writes at most 400 statuses to stay inside API rate limits. A run that hits the cap (or any write failure) exits nonzero; dispatch the workflow again with `move-baseline: true` until a run finishes cleanly.
-   Pull requests that never received a status show as "Expected", which also blocks merging; they get a real status on their next update.
-   A pull request checked at the exact moment the baseline moves can briefly keep an outdated status; it converges on the pull request's next event or the next dispatch.

## My pull request has a red "PR is up to date" status. What do I do?

Update your branch past the current baseline, using either method:

-   Merge the latest `trunk` into your branch, or
-   Rebase your branch onto the latest `trunk`.

Pushing the update re-runs the check and turns it green.

## The `Force PR refresh` label

Committers apply the `Force PR refresh` label to a pull request whose change invalidates all open pull requests, such as a toolchain bump or a repo-wide formatting change. When such a pull request merges, the baseline moves and all open pull requests must update. The label is detected cumulatively on every `trunk` push, so it still takes effect if workflow runs are coalesced.

## Maintainer runbook

The `PR freshness` workflow exposes one `workflow_dispatch` switch, `move-baseline`: it moves the baseline tag to the current `trunk` HEAD and flips stale passing statuses. Re-dispatching when the baseline is already current re-runs only the flip sweep, which is the retry path after an interrupted run.

### Initial setup

The workflow blocks nothing until these one-time steps are completed, in order:

1. Create the `Force PR refresh` label.
2. Seed the baseline: dispatch the workflow with `move-baseline: true`.
3. Let the check run unenforced for a while; active pull requests get stamped by their own events.
4. Ask a repository admin to add `PR is up to date` (source: GitHub Actions) to the trunk ruleset's required status checks, and to add a tag ruleset for `infra-baseline` restricting creation, update, and deletion to the GitHub Actions app.

To roll the check back, remove `PR is up to date` from the required status checks; existing statuses become informational immediately. The tag can stay for a later re-enable.

The implementation lives in `tools/validation/pr-freshness/` and `.github/workflows/pr-is-up-to-date.yml`.
