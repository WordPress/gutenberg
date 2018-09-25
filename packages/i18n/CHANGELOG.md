## 3.0.0 (Unreleased)

### Braking Change

- `wp.i18n.getI18n` has been removed. Use `__`, `_x`, `_n`, or `_nx` instead.
- `wp.i18n.dcnpgettext` has been removed. Use `__`, `_x`, `_n`, or `_nx` instead.

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.

## 1.2.0 (2018-07-12)

### New Feature

- Updated build to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

- Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.1.1 (2018-05-18)

### Polish

- Fix: Standardized `package.json` format  ([#119](https://github.com/WordPress/packages/pull/119))
