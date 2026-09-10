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

**`if: ${{ !cancelled() }}`**, so a failed producer still clears its section instead of leaving a stale one behind.

The job also needs `actions/checkout` before `uses: ./tools/pr-meta`, since a local action needs the repository on disk. `sparse-checkout: tools/pr-meta` is enough. Under `pull_request_target` the checkout must stay on the base ref, never the pull request's head.

## Adding a section

Add it to `SECTIONS` in `src/sections.ts` with an id, heading, scope and character budget. Headings lead with an emoji, so a reader scanning a comment of seven sections can find theirs without reading any of them. The budgets must sum, with the headings and markers, to less than GitHub's 65536-character comment limit; a test covers that.

A `summary` collapses the section behind a fold labelled with it, for content long enough that it would otherwise push the rest of the comment out of view. Leave it out to keep the section open.

`scope` decides how staleness is handled. `commit` sections describe one commit, carry its SHA, and are rejected if they arrive from a rerun of an older one. `pr-state` sections describe the pull request as it currently is and carry no SHA.

## No dependencies

The sources import nothing, so a writer job needs only a checkout and not a dependency install. `src/core.ts` covers the few pieces of `@actions/core` that are needed, and `src/github-api.ts` talks to the REST API through Node's global `fetch`.

It runs straight from the TypeScript sources: the `node24` runtime strips the types on the fly, so there is no build step. Two constraints come with that, relative imports must carry their `.ts` extension, and the syntax must be erasable, which rules out enums, namespaces, parameter properties and decorators.
