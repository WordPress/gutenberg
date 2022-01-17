<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

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
