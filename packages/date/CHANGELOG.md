## 3.0.0 (2018-11-15)

### Breaking Changes

- `getSettings` has been removed. Please use `__experimentalGetSettings` instead.
- `moment` has been removed from the public API for the date module.

## 2.2.1 (2018-11-09)

## 2.2.0 (2018-11-09)

### Deprecations

- Remove `moment` from the public API for the date module.

## 2.1.0 (2018-10-29)

### Breaking Change

- Marked getSettings as experimental

## 2.0.3 (2018-09-26)

### New Features

- Added a `datetimeAbbreviated` format to `getSettings().format` for abbreviated months.

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
