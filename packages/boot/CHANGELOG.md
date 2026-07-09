<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).
-   The save/"review changes" UI now renders `EntitiesSavedStates` from `@wordpress/admin-ui` instead of `@wordpress/editor`, so the editor (and its `block-library`/`media-utils` dependencies) is no longer part of boot's dependency graph and only loads when actually editing (via the canvas). [#80074](https://github.com/WordPress/gutenberg/pull/80074).

## 0.17.0 (2026-07-01)

## 0.16.0 (2026-06-24)

### Enhancements

-   `initSinglePage` now accepts an `initModules` option and runs page init modules before rendering, matching `init`.

## 0.15.1 (2026-06-16)

## 0.15.0 (2026-06-10)

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).
