## 1.5.0 (2019-08-05)

### Bug Fixes

- Resolved an issue where an explicit `undefined` value in the first object may wrongly report as being shallow equal when the two objects are otherwise of equal length. ([#16329](https://github.com/WordPress/gutenberg/pull/16329))

## 1.2.0 (2019-03-06)

### New Feature

- Type-specific variants are now exposed from the module root. In a WordPress context, this has the effect of making them available as `wp.isShallowEqual.isShallowEqualObjects` and `wp.isShallowEqual.isShallowEqualArrays`.

### Internal

- Development source code linting extends the `@wordpress/eslint-plugin/es5` ruleset.

## 1.1.0 (2018-07-12)

### New Feature

- Updated build to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

- Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.0.2 (2018-05-08)

### Bug Fix

- Fix: Use implicit `index.js` for main entry ([#124](https://github.com/WordPress/packages/pull/124))

## 1.0.1 (2018-05-01)

### Bug Fix

- Fix: Passing a null-ish value as one of the arguments now correctly falls back to a strict equality comparison. ([#116](https://github.com/WordPress/packages/pull/116))

## 1.0.0 (2018-04-25)

### New Feature

- Initial release
