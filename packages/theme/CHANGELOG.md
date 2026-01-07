<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Added stylelint plugins for design token linting: `no-unknown-ds-tokens` to catch references to non-existent design tokens, and `no-setting-wpds-custom-properties` to prevent reassignments of design token variables ([#74226](https://github.com/WordPress/gutenberg/pull/74226)).
-   Expose `ThemeProvider` TypeScript type from package. While the component is still experimental, this makes it easier to use TypeScript typings in your code, which would otherwise be inaccessible. ([#74011](https://github.com/WordPress/gutenberg/pull/74011))
