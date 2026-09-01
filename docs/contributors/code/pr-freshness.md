# PR Freshness Check

The `PR is up to date` status check ensures open pull requests contain the latest repo-wide infrastructure changes from `trunk` (toolchain bumps like a Node.js upgrade, or repo-wide formatting and linting changes) before they can be merged. This prevents a pull request based on an older commit from passing CI against an outdated toolchain or reintroducing old-style code.

## How it works

A movable lightweight git tag, `infra-baseline`, points at the last `trunk` commit that every open pull request must contain. The check passes when the tagged commit is an ancestor of the pull request head, and fails otherwise.

The tag moves forward automatically when a `trunk` push changes one of the infrastructure marker paths (for example `.nvmrc`, the workflow files, or the root lint and formatting configs), or when a merged pull request carries the `Force PR refresh` label. When it moves, open pull requests holding a now-outdated passing status are switched to failing, subject to the limits below.

## Limits

The sweep that follows a baseline move is intentionally bounded:

-   Conflicted and draft pull requests are skipped; they cannot merge anyway and are re-checked when they become mergeable or on the next `reconcile` run.
-   Each run writes at most 400 statuses to stay inside API rate limits. A run that hits the cap (or any write failure) exits nonzero; dispatch `reconcile` again until a run finishes cleanly.
-   A pull request checked at the exact moment the baseline moves can briefly keep an outdated status; the next `reconcile` run converges it.

## My pull request has a red "PR is up to date" status. What do I do?

Update your branch past the current baseline, using either method:

-   Merge the latest `trunk` into your branch, or
-   Rebase your branch onto the latest `trunk`.

Pushing the update re-runs the check and turns it green.

## The `Force PR refresh` label

Committers apply the `Force PR refresh` label to a pull request whose change invalidates all open pull requests but does not touch a marker path, such as a formatting rule change inside package source. When such a pull request merges, the baseline moves and all open pull requests must update.

## Maintainer runbook

The `PR freshness` workflow exposes two `workflow_dispatch` switches:

-   `move-baseline`: force-move the baseline tag to the current `trunk` HEAD (also used to seed the tag initially).
-   `reconcile`: re-evaluate and stamp open pull requests. The `bootstrap-window` input limits stamping of not-yet-stamped pull requests to those updated within the given number of days; `0` stamps every open pull request. Use `reconcile` to repair pull requests that missed events and to close the residual window after large baseline moves.

### Initial setup

The workflow blocks nothing until these one-time steps are completed, in order:

1. Create the `Force PR refresh` label.
2. Seed the baseline: dispatch the workflow with `move-baseline: true`.
3. Bootstrap statuses: dispatch with `reconcile: true`, repeating until a run exits cleanly (each run writes at most 400 statuses, so expect several runs).
4. Ask a repository admin to add `PR is up to date` (source: GitHub Actions) to the trunk ruleset's required status checks, and to add a tag ruleset for `infra-baseline` restricting creation, update, and deletion to the GitHub Actions app.

To roll the check back, remove `PR is up to date` from the required status checks; existing statuses become informational immediately. The tag can stay for a later re-enable.

The implementation lives in `tools/validation/pr-freshness/` and `.github/workflows/pr-is-up-to-date.yml`.
