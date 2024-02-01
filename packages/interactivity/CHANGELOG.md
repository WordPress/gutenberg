<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

-   Break up init with yielding to main to prevent long task from hydration. ([#58227](https://github.com/WordPress/gutenberg/pull/58227))

## 4.0.1 (2024-01-31)

### Bug Fixes

-   Ensure Preact is used in published packages ([58258](https://github.com/WordPress/gutenberg/pull/58258).

## 4.0.0 (2024-01-24)

### Enhancements

-   Prevent the usage of Preact components in `wp-text`. ([#57879](https://github.com/WordPress/gutenberg/pull/57879))
-   Update `preact`, `@preact/signals` and `deepsignal` dependencies. ([#57891](https://github.com/WordPress/gutenberg/pull/57891))
-   Export `withScope()` and allow to use it with asynchronous operations. ([#58013](https://github.com/WordPress/gutenberg/pull/58013))

### New Features

-   Add the `data-wp-run` directive along with the `useInit` and `useWatch` hooks. ([#57805](https://github.com/WordPress/gutenberg/pull/57805))
-   Add `wp-data-on-window` and `wp-data-on-document` directives. ([#57931](https://github.com/WordPress/gutenberg/pull/57931))
-   Add the `data-wp-each` directive to render lists of items using a template. ([57859](https://github.com/WordPress/gutenberg/pull/57859))

### Breaking Changes

-   Remove `data-wp-slot` and `data-wp-fill`. ([#57854](https://github.com/WordPress/gutenberg/pull/57854))
-   Remove `wp-data-navigation-link` directive. ([#57853](https://github.com/WordPress/gutenberg/pull/57853))
-   Remove unused `state` and rename `props` to `attributes` in `getElement()`. ([#57974](https://github.com/WordPress/gutenberg/pull/57974))
-   Convert `navigate` and `prefetch` function to actions of the new `core/router` store, available when importing the `@wordpress/interactivity-router` module. ([#57924](https://github.com/WordPress/gutenberg/pull/57924))

### Bug Fix

-   Prevent `wp-data-on=""` from creating `onDefault` handlers. ([#57925](https://github.com/WordPress/gutenberg/pull/57925))

## 3.2.0 (2024-01-10)

### Bug Fix

-   Fix namespaces when there are nested interactive regions. ([#57029](https://github.com/WordPress/gutenberg/pull/57029))

## 3.1.0 (2023-12-13)

## 3.0.0 (2023-11-29)

### Breaking Change

-   Implement the new `store()` API as specified in the [proposal](https://github.com/WordPress/gutenberg/discussions/53586). ([#55459](https://github.com/WordPress/gutenberg/pull/55459))

## 2.7.0 (2023-11-16)

## 2.6.0 (2023-11-02)

### Bug Fix

-   Update the title when using enhanced pagination. ([#55446](https://github.com/WordPress/gutenberg/pull/55446))

## 2.5.0 (2023-10-18)

## 2.4.0 (2023-10-05)

## 2.3.0 (2023-09-20)

### Enhancements

-   Improve `navigate()` to render only the result of the last call when multiple happen simultaneously. ([#54201](https://github.com/WordPress/gutenberg/pull/54201))

### Bug Fix

-   Remove `role` attribute when set to `null` in `data-wp-bind`. ([#54608](https://github.com/WordPress/gutenberg/pull/54608))
-   Add `timeout` option to `navigate()`, with a default value of `10000` milliseconds. ([#54474](https://github.com/WordPress/gutenberg/pull/54474))

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
