<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 8.5.0 (2024-08-07)

## 8.4.0 (2024-07-24)

## 8.3.0 (2024-07-10)

## 8.2.0 (2024-06-26)

## 8.1.0 (2024-06-15)

## 8.0.0 (2024-05-31)

### Breaking Changes

-   Variables like `process.env.IS_GUTENBERG_PLUGIN` have been replaced by `globalThis.IS_GUTENBERG_PLUGIN`. Build systems using `process.env` should be updated ([#61486](https://github.com/WordPress/gutenberg/pull/61486)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 7.29.0 (2024-05-16)

## 7.28.0 (2024-05-02)

## 7.27.0 (2024-04-19)

## 7.26.0 (2024-04-03)

## 7.25.0 (2024-03-21)

## 7.24.0 (2024-03-06)

## 7.23.0 (2024-02-21)

## 7.22.0 (2024-02-09)

## 7.21.0 (2024-01-24)

## 7.20.0 (2024-01-10)

## 7.19.0 (2023-12-13)

## 7.18.0 (2023-11-29)

## 7.17.0 (2023-11-16)

## 7.16.0 (2023-11-02)

## 7.15.0 (2023-10-18)

## 7.14.0 (2023-10-05)

## 7.13.0 (2023-09-20)

## 7.12.0 (2023-08-31)

## 7.11.0 (2023-08-16)

## 7.10.0 (2023-08-10)

## 7.9.0 (2023-07-20)

## 7.8.0 (2023-07-05)

## 7.7.0 (2023-06-23)

## 7.6.0 (2023-06-07)

## 7.5.0 (2023-05-24)

## 7.4.0 (2023-05-10)

## 7.3.0 (2023-04-26)

## 7.2.0 (2023-04-12)

## 7.1.0 (2023-03-29)

## 7.0.0 (2023-03-15)

### Breaking Changes

-   Started requiring Jest v29 instead of v27 as a peer dependency. See [breaking changes in Jest 28](https://jestjs.io/blog/2022/04/25/jest-28) and [in jest 29](https://jestjs.io/blog/2022/08/25/jest-29) ([#47388](https://github.com/WordPress/gutenberg/pull/47388))

## 6.5.0 (2023-03-01)

## 6.4.0 (2023-02-15)

## 6.3.0 (2023-02-01)

## 6.2.0 (2023-01-11)

## 6.1.0 (2023-01-02)

## 6.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

## 5.6.0 (2022-11-16)

## 5.5.0 (2022-11-02)

## 5.4.0 (2022-10-19)

## 5.3.0 (2022-10-05)

### New Features

-   Added Autocomplete Component e2e test suite. [#42905](https://github.com/WordPress/gutenberg/pull/42905).

## 5.2.0 (2022-09-21)

## 5.0.0 (2022-08-24)

### Breaking Changes

-   Increase the minimum Node.js version to 14 ([#43141](https://github.com/WordPress/gutenberg/pull/43141)).

## 4.0.0 (2022-04-08)

### Breaking Changes

-   There's currently an ongoing [project](https://github.com/WordPress/gutenberg/issues/38851) to migrate E2E tests to Playwright instead. This package is deprecated and will only accept bug fixes until fully migrated.

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

### New Features

-   Added Axe (the Accessibility Engine) API integration with e2e tests suite.

## 1.0.0 (2019-03-06)

-   Initial release.
