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

- Add new `addLocaleData` method to merge locale data into the Tannin instance by domain.

## 4.2.0 (2021-07-21)

## 4.1.0 (2021-05-20)

## 4.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 3.20.0 (2021-04-29)

### New Features

-   Add new `resetLocaleData` method to reset the existing Tannin locale data.

## 3.19.0 (2021-03-17)

### Enhancements

-   Export the default `I18n` instance as `defaultI18n`, in addition to already exported bound methods.
-   Add new `getLocaleData` method to get the internal Tannin locale data object.
-   Add new `subscribe` method to subscribe to changes in the internal locale data.
-   Add new `hasTranslation` method to determine whether a translation for a string is available.

## 3.17.0 (2020-12-17)

### Enhancements

-   Improve type declarations for translation functions ([#26171](https://github.com/WordPress/gutenberg/pull/26171))

## 3.12.0 (2020-04-30)

### Bug Fix

-   Relax type of `sprintf` arguments type ([#21919](https://github.com/WordPress/gutenberg/pull/21919))

## 3.11.0 (2020-04-15)

### New Features

-   Include TypeScript type declarations ([#18942](https://github.com/WordPress/gutenberg/pull/18942))
-   Add `createI18n` method to allow creation of multiple i18n instances ([#21182](https://github.com/WordPress/gutenberg/pull/21182))

## 3.10.0 (2020-04-01)

### New Feature

-   Add `isRTL` function ([#20298](https://github.com/WordPress/gutenberg/pull/20298))

## 3.1.0 (2018-11-15)

### Enhancements

-   The module has been internally refactored to use [Tannin](https://github.com/aduth/tannin) in place of [Jed](https://github.com/messageformat/Jed/). This has no impact on the public interface of the module, but should come with considerable benefit to performance, memory usage, and bundle size.

## 3.0.0 (2018-09-30)

### Breaking Changes

-   `getI18n` has been removed. Use `__`, `_x`, `_n`, or `_nx` instead.
-   `dcnpgettext` has been removed. Use `__`, `_x`, `_n`, or `_nx` instead.

### Bug Fixes

-   The initialization of the internal Jed instance now correctly assigns its default data.

## 2.0.0 (2018-09-05)

### Breaking Change

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.

## 1.2.0 (2018-07-12)

### New Feature

-   Updated build to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

-   Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.1.1 (2018-05-18)

### Polish

-   Fix: Standardized `package.json` format ([#119](https://github.com/WordPress/packages/pull/119))
