<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 2.18.0 (2021-01-05)

### Enhancement

-   Include TypeScript type declarations ([#19520](https://github.com/WordPress/gutenberg/pull/19520))

## 2.12.0 (2020-04-30)

### Bug Fixes

-   `isKeyboardEvent` now tests expected modifiers as an exclusive set, fixing an issue where additional modifiers would wrongly report as satisfying a test for a subset of those modifiers [#20733](https://github.com/WordPress/gutenberg/pull/20733).

## 2.0.5 (2018-11-21)

## 2.0.4 (2018-11-20)

## 2.0.3 (2018-10-30)

## 2.0.0 (2018-09-05)

### Breaking Change

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
