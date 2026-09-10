# Required changes from trunk

The `Required changes from trunk` status check ensures open pull requests contain changes that must not be overwritten, such as published package metadata, toolchain updates, or repo-wide formatting changes, before they can be merged. This prevents a pull request based on an older commit from restoring stale release data or passing CI against outdated repository conventions.

## How it works

A movable git ref, `refs/baselines/required-trunk-changes`, points at the last `trunk` commit that every open pull request must contain. The check passes when that commit is an ancestor of the pull request head, and fails otherwise. While the ref does not exist, nothing is required and every pull request passes.

The baseline moves only through explicit release or maintainer intent, in one of three ways:

-   Completing a `latest` npm package release,
-   Merging a pull request that carries the `Require PR update` label, or
-   Dispatching the `Required changes from trunk` workflow with `mode: move-baseline`.

When the baseline moves, every open pull request is restamped with the verdict it now warrants.

The ref lives outside `refs/heads/` and `refs/tags/` on purpose: nothing fetches it unless asked, so a move never disturbs a `git pull`, starts no workflow, and no branch cleanup tool removes it. `git ls-remote origin 'refs/baselines/*'` shows where it points.

## Limits

-   Each run writes at most 450 statuses. A run that stops on that budget, or on a rate limit, exits nonzero and says so; the next `trunk` push, or a dispatch, continues where it left off.
-   A pull request that never received a status shows as "Expected", which also blocks merging. The next refresh or its own next update gives it a real one.
-   A pull request whose head moves while a refresh is running is deferred to the next one rather than stamped at a stale head.

## My pull request has a red "Required changes from trunk" status. What do I do?

Update your branch past the current baseline, using either method:

-   Merge the latest `trunk` into your branch, or
-   Rebase your branch onto the latest `trunk`.

Pushing the update re-runs the check and turns it green. The failing status links to the compare view of exactly what your branch is missing.

## The `Require PR update` label

Committers apply the `Require PR update` label to a pull request whose change invalidates all open pull requests, such as a toolchain bump or a repo-wide formatting change. When such a pull request merges, the baseline moves and all open pull requests must update.

## Maintainer runbook

The `Required changes from trunk` workflow exposes a `mode` dispatch input: `auto` behaves like a `trunk` push, moving the baseline only if a labeled merge earned it and then refreshing, `move-baseline` forces a move to the current `trunk` HEAD and then refreshes, and `refresh-pr-statuses` only refreshes open pull request statuses, which is the retry path after an interrupted run.

### Initial setup

The workflow blocks nothing until these one-time steps are completed, in order:

1. Create the `Require PR update` label.
2. Let a refresh run with no baseline ref. Every open pull request receives a pass, which proves the token and permissions before anything can block.
3. Seed the baseline: dispatch the workflow with `mode: move-baseline`, which seeds it at the current `trunk` HEAD. To seed at an earlier commit, push that commit to the ref directly: `git push origin <sha>:refs/baselines/required-trunk-changes`.
4. Re-dispatch with `mode: refresh-pr-statuses` until a run reports no writes, so that no pull request is left unstamped.
5. Ask a repository admin to add the `Required changes from trunk` commit status (source: GitHub Actions) to the trunk ruleset's required status checks.

Rulesets cannot cover `refs/baselines/`, so anyone with write access can move or delete the ref; the tooling itself only ever fast-forwards it. To roll the check back, remove `Required changes from trunk` from the required status checks; existing statuses become informational immediately.

The workflow lives in `.github/workflows/required-changes-from-trunk.yml` and runs the [`pr-baseline` action](https://github.com/marketplace/actions/pr-baseline), whose [documentation](https://github.com/mawesomedev/mawesome/tree/main/packages/pr-baseline/docs) covers permissions, rate limits and edge cases in full.
