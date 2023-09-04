<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 2.2.0 (2023-08-31)

### Enhancements

-   Support keys using `data-wp-key`. ([#53844](https://github.com/WordPress/gutenberg/pull/53844))
-   Merge new server-side rendered context on client-side navigation. ([#53853](https://github.com/WordPress/gutenberg/pull/53853))
-   Support region-based client-side navigation. ([#53733](https://github.com/WordPress/gutenberg/pull/53733))
-   Improve `data-wp-bind` hydration to match Preact's logic. ([#54003](https://github.com/WordPress/gutenberg/pull/54003))

### New Features

-   Add new directives that implement the Slot and Fill pattern: `data-wp-slot-provider`, `data-wp-slot` and `data-wp-fill`. ([#53958](https://github.com/WordPress/gutenberg/pull/53958))

## 2.1.0 (2023-08-16)

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
