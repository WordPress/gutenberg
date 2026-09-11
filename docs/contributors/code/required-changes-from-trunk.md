# Required changes from trunk

The `Required changes from trunk` status check ensures open pull requests contain the latest required repo-wide infrastructure changes from `trunk` (toolchain bumps like a Node.js upgrade, or repo-wide formatting and linting changes) before they can be merged. This prevents a pull request based on an older commit from passing CI against an outdated toolchain or reintroducing old-style code.

## How it works

A movable git ref, `refs/baselines/required-trunk-changes`, points at the last `trunk` commit that every open pull request must contain. The check passes when that commit is an ancestor of the pull request head, and fails otherwise. While the ref does not exist, nothing is required, and a pull request passes as soon as anything stamps it. Statuses written before it went missing stay as they are until a refresh at `scope: all` revisits them.

The baseline moves only through explicit maintainer intent, in one of two ways:

-   Merging a pull request that carries the `Require PR update` label, or
-   Dispatching the `Required changes from trunk` workflow with `mode: move-baseline`.

When the baseline moves, every open pull request ends up showing the verdict it now warrants.

The ref lives outside `refs/heads/` and `refs/tags/` on purpose: nothing fetches it unless asked, so a move never disturbs a `git pull`, starts no workflow, and no branch cleanup tool removes it. `git ls-remote origin 'refs/baselines/*'` shows where it points.

## Limits

-   Each refresh writes at most 300 statuses. A move rewrites the pull requests showing green, so a large one takes a few `trunk` pushes to land: a run that stops on that budget says so, and the next `trunk` push, or a dispatch, continues where it left off.
-   A pull request that never received a status shows as "Expected", which also blocks merging. Its own next update gives it a real one, except on a Dependabot pull request: every run Dependabot triggers gets a read-only token, so those wait for a dispatch with `mode: refresh-pr-statuses` and `scope: unstamped`.
-   A pull request whose head moves while a refresh is running is deferred rather than stamped at a stale head. The push that moved it reports its own status.

## My pull request has a red "Required changes from trunk" status. What do I do?

Update your branch past the current baseline, using either method:

-   Merge the latest `trunk` into your branch, or
-   Rebase your branch onto the latest `trunk`.

Pushing the update re-runs the check and turns it green. The failing status links to the compare view of exactly what your branch is missing.

## The `Require PR update` label

Committers apply the `Require PR update` label to a pull request whose change invalidates all open pull requests, such as a toolchain bump or a repo-wide formatting change. When such a pull request merges, the baseline moves and all open pull requests must update.

## Maintainer runbook

The `Required changes from trunk` workflow exposes a `mode` dispatch input: `auto` behaves like a `trunk` push, moving the baseline only if a labeled merge earned it and then refreshing, `move-baseline` forces a move to the current `trunk` HEAD and then refreshes, and `refresh-pr-statuses` only refreshes open pull request statuses, which is the retry path after an interrupted run.

A `scope` input picks which open pull requests `mode: refresh-pr-statuses` covers: `corrections` visits the ones showing green, the only ones a forward move can turn red; `unstamped` visits the ones carrying no status yet; and `all` visits every open pull request. The other two modes pick their own scope, `corrections` for `auto` and `all` for `move-baseline`.

Moving the baseline backwards is the exception. It can turn a failing pull request green, so it refreshes at scope `all`, which a `trunk` push does not continue. Re-dispatch with `mode: refresh-pr-statuses` and `scope: all` until a run ends green with nothing remaining. A run that deferred or failed a pull request still reports it as accounted for, so it can say nothing remains while being red.

### Initial setup

The workflow blocks nothing until these one-time steps are completed, in order:

1. Create the `Require PR update` label.
2. Let a refresh run with no baseline ref: dispatch with `mode: refresh-pr-statuses` and `scope: unstamped`. The passes it writes prove the token and permissions before anything can block. It stops on its write budget long before it reaches every pull request, which step 4 finishes.
3. Seed the baseline: dispatch the workflow with `mode: move-baseline`, which seeds it at the current `trunk` HEAD. To seed at an earlier commit, push that commit to the ref directly: `git push origin <sha>:refs/baselines/required-trunk-changes`.
4. Re-dispatch with `mode: refresh-pr-statuses` and `scope: all` until a run ends green with nothing remaining. Step 3 writes nothing when it seeds the ref by direct push, so the passes from step 2 have to be revisited too, not only the pull requests still carrying no status.
5. Ask a repository admin to add the `Required changes from trunk` commit status (source: GitHub Actions) to the trunk ruleset's required status checks.

Rulesets cannot cover `refs/baselines/`, so anyone with write access can move or delete the ref. The tooling only ever fast-forwards it, apart from a forced move, which is also how a baseline left pointing off `trunk` is repaired; in that state the refresh passes the pull requests it reaches rather than blocking them, and the statuses already written stay until it reaches them. To roll the check back, remove `Required changes from trunk` from the required status checks; existing statuses become informational immediately.

The workflow lives in `.github/workflows/required-changes-from-trunk.yml` and runs the [`pr-baseline` action](https://github.com/marketplace/actions/pr-baseline), whose [documentation](https://github.com/mawesomedev/mawesome/tree/main/packages/pr-baseline/docs) covers permissions, rate limits and edge cases in full.
