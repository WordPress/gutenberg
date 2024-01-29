<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 4.50.0 (2024-01-24)

## 4.49.0 (2024-01-10)

## 4.48.0 (2023-12-13)

## 4.47.0 (2023-11-29)

## 4.46.0 (2023-11-16)

## 4.45.0 (2023-11-02)

## 4.44.0 (2023-10-18)

## 4.43.0 (2023-10-05)

## 4.42.0 (2023-09-20)

## 4.41.0 (2023-08-31)

## 4.40.0 (2023-08-16)

## 4.39.0 (2023-08-10)

## 4.38.0 (2023-07-20)

## 4.37.0 (2023-07-05)

## 4.36.0 (2023-06-23)

## 4.35.0 (2023-06-07)

## 4.34.0 (2023-05-24)

## 4.33.0 (2023-05-10)

## 4.32.0 (2023-04-26)

## 4.31.0 (2023-04-12)

## 4.30.0 (2023-03-29)

## 4.29.0 (2023-03-15)

## 4.28.0 (2023-03-01)

## 4.27.0 (2023-02-15)

## 4.26.0 (2023-02-01)

## 4.25.0 (2023-01-11)

## 4.24.0 (2023-01-02)

## 4.23.0 (2022-12-14)

## 4.22.0 (2022-11-16)

## 4.21.0 (2022-11-02)

## 4.20.0 (2022-10-19)

## 4.19.0 (2022-10-05)

## 4.18.0 (2022-09-21)

## 4.17.0 (2022-09-13)

## 4.16.0 (2022-08-24)

## 4.15.0 (2022-08-10)

## 4.14.0 (2022-07-27)

## 4.13.0 (2022-07-13)

## 4.12.0 (2022-06-29)

## 4.11.0 (2022-06-15)

## 4.10.0 (2022-06-01)

## 4.9.0 (2022-05-18)

## 4.8.0 (2022-05-04)

## 4.7.0 (2022-04-21)

## 4.6.0 (2022-04-08)

## 4.5.0 (2022-03-23)

## 4.4.0 (2022-03-11)

## 4.3.0 (2022-01-27)

## 4.2.0 (2021-07-21)

## 4.1.0 (2021-05-20)

## 4.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 3.1.0 (2021-03-17)

## 3.0.0 (2020-12-17)

### Breaking Change

-   Re-write using ES Modules causing CJS default import to change from `require('@wordpress/is-shallow-equal)` to `require('@wordpress/is-shallow-equal).default`. ([#26833](https://github.com/WordPress/gutenberg/pull/26833))

## 2.0.0 (2020-04-15)

### Breaking Change

-   Restructure package moving source files into `lib` directory. Direct imports of
    `@wordpress/is-shallow-equal/arrays` and `@wordpress/is-shallow-equal/objects` were never
    officially supported and have been removed. ([#18942](https://github.com/WordPress/gutenberg/pull/18942))

### New feature

-   Include TypeScript type declarations ([#18942](https://github.com/WordPress/gutenberg/pull/18942))

## 1.5.0 (2019-08-05)

### Bug Fixes

-   Resolved an issue where an explicit `undefined` value in the first object may wrongly report as being shallow equal when the two objects are otherwise of equal length. ([#16329](https://github.com/WordPress/gutenberg/pull/16329))

## 1.2.0 (2019-03-06)

### New Feature

-   Type-specific variants are now exposed from the module root. In a WordPress context, this has the effect of making them available as `wp.isShallowEqual.isShallowEqualObjects` and `wp.isShallowEqual.isShallowEqualArrays`.

### Internal

-   Development source code linting extends the `@wordpress/eslint-plugin/es5` ruleset.

## 1.1.0 (2018-07-12)

### New Feature

-   Updated build to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

-   Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.0.2 (2018-05-08)

### Bug Fix

-   Fix: Use implicit `index.js` for main entry ([#124](https://github.com/WordPress/packages/pull/124))

## 1.0.1 (2018-05-01)

### Bug Fix

-   Fix: Passing a null-ish value as one of the arguments now correctly falls back to a strict equality comparison. ([#116](https://github.com/WordPress/packages/pull/116))

## 1.0.0 (2018-04-25)

### New Feature

-   Initial release
