# Theme

`@wordpress/theme` provides the token source, generated token artifacts, ThemeProvider behavior, and tooling that keeps token usage correct.

## Use it for

- Loading the default token stylesheet outside WordPress.
- Applying theme overrides to an app or subtree.
- Generating and maintaining token artifacts.
- Catching invalid token usage with stylelint and build plugins.

## Stability note

The package is experimental. The ThemeProvider documentation is useful, but the public/private API boundary has recently changed to preserve bundled-package compatibility. Check exports before documenting an API as stable.

## Sources

- [@wordpress/theme README](../../../packages/theme/README.md)
- [ThemeProvider stable API revert PR #79594](../../_sources/github/threads/pr-79594.md)
- [Theme package export validation PR #79553](../../_sources/github/threads/pr-79553.md)
- [Theme npm surface validation PR #79552](../../_sources/github/threads/pr-79552.md)
