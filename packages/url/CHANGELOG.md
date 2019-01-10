## 2.3.3 (2019-01-03)

### Bug Fixes

- `addQueryArgs` will return only the querystring fragment if the passed `url` is undefined. Previously, an uncaught error would be thrown.
- `addQueryArgs` will not append (or remove) a `?` if there are no query arguments to be added. Previously, `?` would be wrongly appended even if there was no querystring generated.

## 2.3.2 (2018-12-12)

## 2.3.1 (2018-11-20)

### Bug fixes

- The `isValidProtocol` function now correctly considers the protocol of the URL as only incoporating characters up to and including the colon (':').
- `getFragment` is now greedier and matches fragments from the first occurence of the '#' symbol instead of the last.

## 2.3.0 (2018-11-12)

### New Features

- Added `getProtocol`.
- Added `isValidProtocol`.
- Added `getAuthority`
- Added `isValidAuthority`.
- Added `getPath`.
- Added `isValidPath`.
- Added `getQueryString`.
- Added `isValidQueryString`.
- Added `getFragment`.
- Added `isValidFragment`.

## 2.2.0 (2018-10-29)

### New Features

- Added `getQueryArg`.
- Added `hasQueryArg`.
- Added `removeQueryArgs`.

## 2.1.0 (2018-10-16)

### New Feature

- Added `safeDecodeURI`.

## 2.0.1 (2018-09-30)

### Bug Fix

- Fix typo in the `qs` dependency definition in the `package.json`

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
