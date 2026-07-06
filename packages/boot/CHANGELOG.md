<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

-   Load the editor lazily. The save/"review changes" UI no longer statically imports `@wordpress/editor`, so the editor (and its `block-editor`/`block-library`/`media-utils` dependencies) is only loaded on demand instead of eagerly on every view, including list views that never edit.

## 0.17.0 (2026-07-01)

## 0.16.0 (2026-06-24)

### Enhancements

-   `initSinglePage` now accepts an `initModules` option and runs page init modules before rendering, matching `init`.

## 0.15.1 (2026-06-16)

## 0.15.0 (2026-06-10)

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).
