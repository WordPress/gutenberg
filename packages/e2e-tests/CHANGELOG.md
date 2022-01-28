<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 3.0.0 (2022-01-27)

### Breaking Changes

-   The peer `puppeteer` dependency has been replaced with `puppeteer-core` requiring version `>=11` (see [Breaking Changes](https://github.com/puppeteer/puppeteer/releases/tag/v11.0.0), [#36040](https://github.com/WordPress/gutenberg/pull/36040)).
-   The peer `jest` dependency has been updated from requiring `>=26` to requiring `>=27` (see [Breaking Changes](https://jestjs.io/blog/2021/05/25/jest-27), [#33287](https://github.com/WordPress/gutenberg/pull/33287)).

## 2.5.0 (2021-09-09)

### New Features

-   Emulate `prefers-reduced-motion: reduce` [#34132](https://github.com/WordPress/gutenberg/pull/34132).

## 2.4.0 (2021-07-29)

### New Features

-   Bail out tests if a prior snapshot failed. Fixed a bug which failing snapshots won't trigger screenshots [#33448](https://github.com/WordPress/gutenberg/pull/33448).

## 2.0.0 (2021-01-21)

### Breaking Changes

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).

## 1.9.1 (2020-01-01)

## 1.9.0 (2019-12-19)

### New Features

-   Added `THROTTLE_CPU` and `DOWNLOAD_THROUGHPUT` environment variable configuration options ([#18770](https://github.com/WordPress/gutenberg/pull/18770)).

## 1.8.0 (2019-11-15)

## 1.7.0 (2019-09-16)

## 1.6.0 (2019-09-03)

## 1.2.0 (2019-05-21)

### New features

-   Added Axe (the Accessibility Engine) API integration with e2e tests suite.

## 1.0.0 (2019-03-06)

-   Initial release.
