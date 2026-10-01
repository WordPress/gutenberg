# PR meta

A GitHub action that maintains a single automation comment on a pull request, so the repository posts one comment per pull request instead of one per workflow.

Each producing workflow calls this action with a `section` id and a body. The action reads the existing comment, replaces only that section, and writes the whole thing back. A section registry fixes the render order, so the comment looks the same however the workflows interleave.

## Usage

```yaml
- uses: ./tools/pr-meta
  with:
      repo-token: ${{ secrets.GITHUB_TOKEN }}
      section: bundle-size
      body-path: pr-meta/body.md
      commit-sha: ${{ github.event.pull_request.head.sha }}
      run-url: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

An empty body, or a `body-path` pointing at a file that does not exist, removes the section. That is how a producer with nothing to report clears a stale one.

## Writing a section

Every calling job needs three things, and each of them fixes a specific failure:

**A shared concurrency group**, so writers do not overwrite each other:

```yaml
concurrency:
    group: pr-meta-${{ github.event.number }}
    cancel-in-progress: false
    queue: max
```

`queue: max` matters. The default cancels a pending run once a third arrives, which silently drops a section. On a `push`-triggered workflow `github.event.number` is empty, so the pull request number has to come from somewhere else, such as a producer job output.

**Its own `permissions`**, which do not carry over from another job:

```yaml
permissions:
    contents: read
    pull-requests: write
```

**A deliberate answer to producer failure.** Use `if: ${{ !cancelled() }}` where a missing result reliably means "nothing to report", so a failed producer clears its section rather than leaving a stale one. Where a missing result is instead indistinguishable from a failure, require the producer to have succeeded, as the props and flaky tests writers do; clearing there would erase something nothing had disproved.

The job also needs `actions/checkout` before `uses: ./tools/pr-meta`, since a local action needs the repository on disk. `sparse-checkout: tools/pr-meta` is enough. Under `pull_request_target` the checkout must stay on the base ref, never the pull request's head.

## What a section gives up

The comment is edited in place, and GitHub only notifies on the `@mention`s in a comment when it is first created. A section that mentions someone therefore does not notify them, so it cannot be the only way they hear about something.

A section is truncated when it is written, not when it is rendered, so this revision never shortens a section it did not produce. That holds only for writers running this revision: an earlier one truncates at render, so a release branch still carrying it will re-cut a section on every write, and a props list long enough to be truncated loses the trailer a committer copies.

That sets the order for backporting to a release branch. This action goes first, on its own; the workflow that adds a section goes after. A branch whose action still truncates at render will cut a section written by another branch, so giving it a producer before the action is what creates the mixed pair.

A workflow triggered by `pull_request_target` or `issue_comment` runs from the default branch whatever the pull request targets, so it reaches release branch pull requests before that branch has been backported anything. `require-base` holds a section back until then: the writer does nothing unless the pull request targets the branch named, so pass `${{ github.event.repository.default_branch }}` and drop it once every release branch carries this action.

## Adding a section

Add it to `SECTIONS` in `src/sections.ts` with an id, heading, scope and character budget. Headings lead with an emoji, so a reader scanning a comment of seven sections can find theirs without reading any of them. The budgets must sum, with the headings and markers, to less than GitHub's 65536-character comment limit; a test covers that.

A producer renders its markdown without knowing where it will sit, so any headings in a body are demoted to sit below the section heading, keeping their relative hierarchy. Headings inside a code fence are left alone, and a body deep enough to need a seventh level flattens at the sixth, markdown having no more. Setext headings, the ones underlined with `=` or `-`, are not demoted.

A `summary` collapses the section behind a fold labelled with it, for content long enough that it would otherwise push the rest of the comment out of view. Leave it out to keep the section open, which is what a body that folds its own items already needs.

`keep` decides which end survives truncation. The default drops the ending, which suits a section whose first lines matter most. `keep: 'end'` drops the beginning instead, for a body like props that closes with the part a reader acts on, and reopens a code fence the dropped start left open.

`scope` decides how staleness is handled. `commit` sections describe one commit, carry its SHA, and are rejected if they arrive from a rerun of an older one. `pr-state` sections describe the pull request as it currently is and carry no SHA.

## No dependencies

The sources import nothing, so a writer job needs only a checkout and not a dependency install. `src/core.ts` covers the few pieces of `@actions/core` that are needed, and `src/github-api.ts` talks to the REST API through Node's global `fetch`.

It runs straight from the TypeScript sources: the `node24` runtime strips the types on the fly, so there is no build step. Two constraints come with that, relative imports must carry their `.ts` extension, and the syntax must be erasable, which rules out enums, namespaces, parameter properties and decorators.
