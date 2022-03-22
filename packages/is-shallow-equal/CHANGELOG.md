<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

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
