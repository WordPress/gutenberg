## 2.0.3 (2018-10-29)

### Polish

- Fix: `count` returns 0 for empty strings ([#10602](https://github.com/WordPress/gutenberg/pull/10602))

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.

## 1.1.0 (2018-07-12)

### New Feature

- Updated build to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Polish

- Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.0.3 (2018-05-18)

### Polish

- Fix: Standardized `package.json` format  ([#119](https://github.com/WordPress/packages/pull/119))

## 1.0.2 (2018-05-08)

### Bug Fix

- Fix: Resolve error when input strings contains only whitespace ([#123](https://github.com/WordPress/packages/pull/123))

## 1.0.1 (2018-05-01)

### Polish

- Internal: Include `publishConfig` configuration in `package.json`. ([#114](https://github.com/WordPress/packages/pull/114))

## 1.0.0 (2018-04-24)

### New Feature

- Initial release
