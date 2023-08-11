<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Allow passing optional `afterLoad` callbacks to `store` calls. ([#53363](https://github.com/WordPress/gutenberg/pull/53363))

### Bug Fix

-   Add support for underscores and leading dashes in the suffix part of the directive. ([#53337](https://github.com/WordPress/gutenberg/pull/53337))
-   Add an asynchronous short circuit to `useSignalEffect` to avoid infinite loops. ([#53358](https://github.com/WordPress/gutenberg/pull/53358))

### Enhancements

-   Add JSDoc comments to `store()` and `directive()` functions. ([#52469](https://github.com/WordPress/gutenberg/pull/52469))

## 2.0.0 (2023-08-10)

### Breaking Change

-   Remove the `wp-show` directive until we figure out its final implementation. ([#53240](https://github.com/WordPress/gutenberg/pull/53240))

## 1.2.0 (2023-07-20)

### New Features

-   Runtime support for the `data-wp-style` directive. ([#52645](https://github.com/WordPress/gutenberg/pull/52645))
