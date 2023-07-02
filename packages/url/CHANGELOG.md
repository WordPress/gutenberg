<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 3.37.0 (2023-06-23)

## 3.36.0 (2023-06-07)

## 3.35.0 (2023-05-24)

## 3.34.0 (2023-05-10)

## 3.33.0 (2023-04-26)

## 3.32.0 (2023-04-12)

## 3.31.0 (2023-03-29)

## 3.30.0 (2023-03-15)

## 3.29.0 (2023-03-01)

## 3.28.0 (2023-02-15)

## 3.27.0 (2023-02-01)

## 3.26.0 (2023-01-11)

## 3.25.0 (2023-01-02)

## 3.24.0 (2022-12-14)

## 3.23.0 (2022-11-16)

## 3.22.0 (2022-11-02)

## 3.21.0 (2022-10-19)

## 3.20.0 (2022-10-05)

## 3.19.0 (2022-09-21)

## 3.18.0 (2022-09-13)

## 3.17.0 (2022-08-24)

## 3.16.0 (2022-08-10)

## 3.15.0 (2022-07-27)

## 3.14.0 (2022-07-13)

## 3.13.0 (2022-06-29)

## 3.12.0 (2022-06-15)

## 3.11.0 (2022-06-01)

## 3.10.0 (2022-05-18)

## 3.9.0 (2022-05-04)

## 3.8.0 (2022-04-21)

## 3.7.0 (2022-04-08)

## 3.6.0 (2022-03-23)

## 3.5.0 (2022-03-11)

## 3.4.0 (2022-01-27)

## 3.3.0 (2021-11-07)

### New Feature

-   Added new `normalizePath` function ([#35992](https://github.com/WordPress/gutenberg/pull/35992)).

## 3.2.3 (2021-10-12)

### Bug Fix

-   Removed unused `react-native-url-polyfill` dependency ([#34687](https://github.com/WordPress/gutenberg/pull/34687)).

## 3.2.0 (2021-07-21)

## 3.1.0 (2021-05-20)

## 3.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 2.22.0 (2021-03-17)

## 2.21.0 (2021-01-05)

### New Feature

-   Add optional argument `maxLength` for truncating URL in `filterURLForDisplay`

## 2.16.0 (2020-06-15)

### New Feature

-   Added `getPathAndQueryString`.

## 2.14.0 (2020-04-30)

### Bug fix

-   `addQueryArgs` arguments are optional ([#21926](https://github.com/WordPress/gutenberg/pull/21926))

## 2.13.0 (2020-04-15)

### New feature

-   Include TypeScript type declarations ([#18942](https://github.com/WordPress/gutenberg/pull/18942))

# 2.12.0 (2020-04-01)

### Bug Fixes

-   `getQueryString` now correctly considers hash fragments when considering whether to return a query string. Previously, `getQueryString( 'https://example.com/#?foo' )` would wrongly return `'foo'` as its result. A hash fragment is always the last segment of a URL, and the querystring must always precede it ([see reference specification](https://url.spec.whatwg.org/#absolute-url-with-fragment-string)).

## 2.11.0 (2020-02-10)

### Bug Fixes

-   `isURL` now correctly returns `true` for many other forms of a valid URL, as it now conforms to the [URL Living Standard](https://url.spec.whatwg.org/) definition of a [valid URL string](https://url.spec.whatwg.org/#valid-url-string).

## 2.3.3 (2019-01-03)

### Bug Fixes

-   `addQueryArgs` will return only the querystring fragment if the passed `url` is undefined. Previously, an uncaught error would be thrown.
-   `addQueryArgs` will not append (or remove) a `?` if there are no query arguments to be added. Previously, `?` would be wrongly appended even if there was no querystring generated.

## 2.3.2 (2018-12-12)

## 2.3.1 (2018-11-20)

### Bug fixes

-   The `isValidProtocol` function now correctly considers the protocol of the URL as only incoporating characters up to and including the colon (':').
-   `getFragment` is now greedier and matches fragments from the first occurrence of the '#' symbol instead of the last.

## 2.3.0 (2018-11-12)

### New Features

-   Added `getProtocol`.
-   Added `isValidProtocol`.
-   Added `getAuthority`
-   Added `isValidAuthority`.
-   Added `getPath`.
-   Added `isValidPath`.
-   Added `getQueryString`.
-   Added `isValidQueryString`.
-   Added `getFragment`.
-   Added `isValidFragment`.

## 2.2.0 (2018-10-29)

### New Features

-   Added `getQueryArg`.
-   Added `hasQueryArg`.
-   Added `removeQueryArgs`.

## 2.1.0 (2018-10-16)

### New Feature

-   Added `safeDecodeURI`.

## 2.0.1 (2018-09-30)

### Bug Fix

-   Fix typo in the `qs` dependency definition in the `package.json`

## 2.0.0 (2018-09-05)

### Breaking Change

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
