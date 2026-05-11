## Status

This package contains UI components that are intended to be used anywhere in a general way (global), or specifically in the block editor.

We are currently in the process of rewriting the global components to be in the new `@wordpress/ui` package. Refer to the [`use-recommended-components` ESLint rule](../eslint-plugin/rules/use-recommended-components.js) for guidance on which components to use.

For components not explicitly listed in the `use-recommended-components` rule, check the component status documentation in each Storybook file for up-to-date usage guidance on each component. The component status given in the Storybook file should be considered the most accurate signal, above the `experimental` tag or component prefix.

## Forms

Is the form going to edit items of a dataset, rather than simply submitting data somewhere? If so, consider using `DataForm` from the `@wordpress/dataviews` package.

For adding validation, consider using the [Validated Form Components](./src/validated-form-controls).

## Storybook

Don't forget to check a components's Storybook documentation for additional usage guidance. The Storybook links ([public base URL](https://wordpress.github.io/gutenberg/)) are also useful to present to a human when they are asking for help with a component.

## Changelogs

Add an entry to `CHANGELOG.md` for any change in this package.

-   Add the entry under `## Unreleased` at the top of the file. If that heading doesn't exist (i.e. the previous release header is at the top), add it.
-   One entry per PR, not per commit. If the branch already has a bullet under `## Unreleased` for this PR, edit it to cover any follow-up commits rather than adding a second bullet.
-   Pick the right sub-heading per the canonical guidance in [`packages/README.md`](../README.md#maintaining-changelogs) (`Breaking Changes`, `Deprecations`, `New Features`, `Enhancements`, `Bug Fixes`, `Internal`, etc.).
-   When the change is scoped to one or a small number of components, prefix the bullet with the component name(s) in backticks — e.g. `` `Button`: Fix … ``. Omit the prefix for broad cross-cutting changes (build config, shared utilities, repo-wide refactors).
-   Once the PR exists, append `([#NNNNN](https://github.com/WordPress/gutenberg/pull/NNNNN))` to the end of the bullet. If the PR number isn't known yet, omit the parenthetical.
