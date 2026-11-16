<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Bug Fixes

-   Parse CSS `var()` references for PostCSS fallback injection and Stylelint validation, avoiding false positives in strings and URLs ([#83766](https://github.com/WordPress/gutenberg/pull/83766)).

### Internal

-   Widen the `@wordpress/theme` peer dependency range to include 5.x ([#86720](https://github.com/WordPress/gutenberg/pull/86720)).
-   Update the Vite development dependency to 8.3.6 ([#86500](https://github.com/WordPress/gutenberg/pull/86500)).
-   Update the Vitest development dependency to 5.1.0 ([#86509](https://github.com/WordPress/gutenberg/pull/86509)).

## 1.0.0 (2026-11-04)

-   Initial release, with the build and Stylelint plugins moved from `@wordpress/theme` ([#83568](https://github.com/WordPress/gutenberg/pull/83568), [#85388](https://github.com/WordPress/gutenberg/pull/85388)).
-   Update the Vite development dependency to 8.3.5 for build plugin tests ([#85739](https://github.com/WordPress/gutenberg/pull/85739)).

### Internal

-   Update the Vitest development dependency to 5.0.5 ([#86173](https://github.com/WordPress/gutenberg/pull/86173)).
