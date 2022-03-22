<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 3.4.0 (2022-03-11)

## 3.3.0 (2022-01-27)

## 3.2.0 (2021-07-21)

## 3.1.0 (2021-05-20)

## 3.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 2.12.0 (2021-03-17)

## 2.11.0 (2020-12-17)

### New Feature

-   Include TypeScript type declarations ([#26429](https://github.com/WordPress/gutenberg/pull/26429))

## 2.6.0 (2019-08-29)

### Bug Fix

-   When there is no `options.version` param provided `deprecated` method warns with more relaxed tone.

## 2.0.4 (2019-01-03)

## 2.0.0 (2018-09-05)

### Breaking Change

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.

### New Feature

-   Call `doAction` hook when a deprecated feature is encountered ([#8110](https://github.com/WordPress/gutenberg/pull/8110))
