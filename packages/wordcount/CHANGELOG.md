<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 3.4.0 (2022-03-11)

## 3.3.0 (2022-01-27)

## 3.2.0 (2021-07-21)

## 3.1.0 (2021-05-20)

### Enhancement

-   Adjusted count logic to recognize also numbers as words ([#27288](https://github.com/WordPress/gutenberg/pull/27288)).

## 3.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 2.15.0 (2021-03-17)

## 2.0.3 (2018-10-29)

### Polish

-   Fix: `count` returns 0 for empty strings ([#10602](https://github.com/WordPress/gutenberg/pull/10602))

## 2.0.0 (2018-09-05)

### Breaking Change

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.

## 1.1.0 (2018-07-12)

### New Feature

-   Updated build to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Polish

-   Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.0.3 (2018-05-18)

### Polish

-   Fix: Standardized `package.json` format ([#119](https://github.com/WordPress/packages/pull/119))

## 1.0.2 (2018-05-08)

### Bug Fix

-   Fix: Resolve error when input strings contains only whitespace ([#123](https://github.com/WordPress/packages/pull/123))

## 1.0.1 (2018-05-01)

### Polish

-   Internal: Include `publishConfig` configuration in `package.json`. ([#114](https://github.com/WordPress/packages/pull/114))

## 1.0.0 (2018-04-24)

### New Feature

-   Initial release
