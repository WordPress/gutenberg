<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Breaking Changes

-   The peer `jest` dependency has been updated from requiring `>=26` to requiring `>=27` (see [Breaking Changes](https://jestjs.io/blog/2021/05/25/jest-27), [#33287](https://github.com/WordPress/gutenberg/pull/33287)).

## 4.0.0 (2021-01-21)

### Breaking Changes

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).
-   The peer `jest` dependency has been updated from requiring `>=24` to requiring `>=26` (see [Breaking Changes](https://jestjs.io/blog/2020/05/05/jest-26), [#27956](https://github.com/WordPress/gutenberg/pull/27956)).

## 3.0.0 (2019-03-06)

### Breaking Changes

-   Increased the recommended Jest dependency to version 24 ([#13922](https://github.com/WordPress/gutenberg/pull/13922).

## 2.0.7 (2018-11-20)

## 2.0.5 (2018-09-30)

### Bug Fixes

-   Captures and protects against unexpected console logging occurring during lifecycle.

## 2.0.0 (2018-07-12)

### Breaking Changes

-   Add new API methods `toHaveInformed`, `toHaveInformedWith`, `toHaveLogged` and `toHaveLoggedWith` ([#137](https://github.com/WordPress/packages/pull/137)). If the code under test calls `console.log` or `console.info` it will fail, unless one of the newly introduced methods is explicitly used to verify it.
-   Updated code to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

-   Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.0.7 (2018-05-18)

### Polish

-   Fix: Standardized `package.json` format ([#119](https://github.com/WordPress/packages/pull/119))

## 1.0.6 (2018-02-28)

### Polish

-   Removed `package-lock.json` file, lockfiles for apps, not packages ([#88](https://github.com/WordPress/packages/pull/88))
