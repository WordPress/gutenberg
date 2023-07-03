<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

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

## Deprecations

-   `__experimentalGetSettings` has been renamed to `getSettings`.

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

## 3.15.0 (2021-04-06)

### New Feature

-   Bundle type definitions.

## 3.14.0 (2021-03-17)

## 3.0.1 (2018-12-12)

## 3.0.0 (2018-11-15)

### Breaking Changes

-   `getSettings` has been removed. Please use `__experimentalGetSettings` instead.
-   `moment` has been removed from the public API for the date module.

## 2.2.1 (2018-11-09)

## 2.2.0 (2018-11-09)

### Deprecations

-   Remove `moment` from the public API for the date module.

## 2.1.0 (2018-10-29)

### Breaking Change

-   Marked getSettings as experimental

## 2.0.3 (2018-09-26)

### New Features

-   Added a `datetimeAbbreviated` format to `getSettings().format` for abbreviated months.

## 2.0.0 (2018-09-05)

### Breaking Change

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
