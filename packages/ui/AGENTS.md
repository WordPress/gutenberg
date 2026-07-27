## Changelogs

Add an entry to `CHANGELOG.md` for any change in this package.

-   Add the entry under `## Unreleased` at the top of the file. If that heading doesn't exist (i.e. the previous release header is at the top), add it.
-   One entry per PR, not per commit. If the branch already has a bullet under `## Unreleased` for this PR, edit it to cover any follow-up commits rather than adding a second bullet.
-   Pick the right sub-heading per the canonical guidance in [`packages/README.md`](../README.md#maintaining-changelogs) (`Breaking Changes`, `Deprecations`, `New Features`, `Enhancements`, `Bug Fixes`, `Internal`, etc.).
-   When the change is scoped to one or a small number of components, prefix the bullet with the component name(s) in backticks — e.g. `` `Select`: Fix … ``. Omit the prefix for broad cross-cutting changes (build config, shared utilities, repo-wide refactors).
-   Once the PR exists, append `([#NNNNN](https://github.com/WordPress/gutenberg/pull/NNNNN))` to the end of the bullet. If the PR number isn't known yet, omit the parenthetical.
