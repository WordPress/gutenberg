<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 1.20.0 (2026-08-12)

### Internal

-   Font Library: Use the new `@wordpress/kebab-case` package instead of unlocking the `kebabCase` utility from the `@wordpress/components` private APIs ([#81294](https://github.com/WordPress/gutenberg/pull/81294)).

### Enhancements

-   Add a `showBlockStateControls` prop to `GlobalStylesUI`, defaulting to `true`, which hides the state controls for blocks when set to `false` ([#80956](https://github.com/WordPress/gutenberg/pull/80956)).

## 1.19.0 (2026-07-29)

### Bug Fixes

-   Font Library: Give the "Install fonts" search field a fixed width so it no longer resizes when the reset button appears or disappears as the search value changes ([#80315](https://github.com/WordPress/gutenberg/pull/80315)).

### Internal

-   Update `exports` to use subpath patterns instead of deprecated trailing `/` folder mappings ([#80270](https://github.com/WordPress/gutenberg/pull/80270)).

## 1.18.0 (2026-07-14)

### Enhancements

-   Use the emphasis font-weight token for UI emphasis ([#80093](https://github.com/WordPress/gutenberg/pull/80093)).
-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

## 1.17.0 (2026-07-01)

## 1.16.0 (2026-06-24)

## 1.15.1 (2026-06-16)

## 1.15.0 (2026-06-10)

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).
