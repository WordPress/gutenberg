<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Breaking Changes

-   The peer `puppeteer` dependency has been updated from requiring `>=1.19` to requiring `>=11` (see [Breaking Changes](https://github.com/puppeteer/puppeteer/releases/tag/v11.0.0), [#36040](https://github.com/WordPress/gutenberg/pull/36040)).
-   The peer `jest` dependency has been updated from requiring `>=26` to requiring `>=27` (see [Breaking Changes](https://jestjs.io/blog/2021/05/25/jest-27), [#33287](https://github.com/WordPress/gutenberg/pull/33287)).

## 3.0.0 (2021-01-21)

### Breaking Changes

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).

## 2.0.0 (2020-12-17)

### Breaking Changes

-   The peer `jest` dependency has been updated from requiring `>=24` to requiring `>=26` (see [Breaking Changes](https://jestjs.io/blog/2020/05/05/jest-26), [#27956](https://github.com/WordPress/gutenberg/pull/27956)).

### Breaking Changes

-   Migrated `axe-puppeteer` to its new package [@axe-core/puppeteer](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/puppeteer) that contains breaking changes.

## 1.1.0 (2019-05-21)

### New Feature

-   Added optional `disabledRules` option to use with `toPassAxeTests` matcher.

## 1.0.0 (2019-03-06)

-   Initial release.
