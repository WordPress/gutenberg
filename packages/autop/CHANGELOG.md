## 2.3.0 (2019-05-21)

### Bug Fix

- `removep` will correctly preserve multi-line paragraph tags where attributes are present.

## 2.1.0 (2019-03-06)

### Bug Fix

- `autop` correctly matches whitespace preceding and following block-level elements.

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.

## 1.1.0 (2018-07-12)

### New Feature

- Updated build to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

- Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.0.6 (2018-05-08)

### Polish

- Documentation: Fix API method typo for `removep`. ([#120](https://github.com/WordPress/packages/pull/120))
