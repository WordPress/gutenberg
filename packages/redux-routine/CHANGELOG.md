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

### Internal

-   Lodash: Remove completely from `@wordpress/redux-routine` package ([#43741](https://github.com/WordPress/gutenberg/pull/43741)).

## 4.16.0 (2022-08-24)

### Bug Fix

-   Packages: Replace `is-plain-obj` with `is-plain-object` ([#43511](https://github.com/WordPress/gutenberg/pull/43511)).

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

### New Features

-   Added and published TypeScript annotations

## 4.1.0 (2021-05-20)

## 4.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 3.14.0 (2021-03-17)

## 3.7.0 (2020-02-04)

### Bug Fix

-   Change the `isGenerator` check for better compatibility with generator helper libraries ([#19666](https://github.com/WordPress/gutenberg/pull/19666)).

## 3.1.0 (2019-03-06)

### Bug Fixes

-   Fix unhandled promise rejection error caused by returning null from registered generator ([#13314](https://github.com/WordPress/gutenberg/pull/13314))
-   The middleware will no longer attempt to coerce an error to an instance of `Error`, and instead passes through the thrown value directly. This resolves issues where an `Error` would be thrown when the underlying values were not of type `Error` or `string` (e.g. a thrown object) and the message would end up not being useful (e.g. `[Object object]`).
    ([#13315](https://github.com/WordPress/gutenberg/pull/13315))
-   Fix unintended recursion when invoking sync routine ([#13818](https://github.com/WordPress/gutenberg/pull/13818))

## 3.0.3 (2018-10-19)

## 3.0.2 (2018-10-18)

### Bug Fix

-   Account for null value in redux-routine createRuntime (introduces `isAction` and `isActionOfType` methods to assist with that).

## 3.0.0 (2018-09-30)

### Breaking change

-   The middleware returns a promise resolving once the runtime finishes iterating over the generator.
-   It's not possible to kill the execution of the runtime anymore by returning `undefined`

## Bug Fixes

-   Fix running routines in Firefox.

## 2.0.0 (2018-09-05)

### Breaking Change

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
