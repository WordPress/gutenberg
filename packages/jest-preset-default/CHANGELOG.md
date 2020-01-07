## 5.3.1 (2020-01-01)

### Bug Fixes

- Fix preset file extension for inclusion in NPM deployments. ([#19306](https://github.com/WordPress/gutenberg/pull/19306)).

## 5.3.0 (2019-12-20)

### New Features

- Added support to collapse or omit successful test results from Travis CI builds ([#16744](https://github.com/WordPress/gutenberg/issues/16744))


## 5.2.0 (2019-11-15)

## 5.1.0 (2019-09-03)

### Bug Fixes

- Add `wordpress` folder to the list of ignored paths ([#17296](https://github.com/WordPress/gutenberg/pull/17296)).

## 5.0.0 (2019-08-29)

### Breaking Changes

- Files with `.spec.js` suffix are no longer matched as test files by default.

### New Features

- Align `testMatch` config option with Jest and allow test files with `.ts` suffix.

## 4.0.0 (2019-03-06)

### Breaking Changes

- The bundled `jest` dependency has been updated from requiring `^23.6.0` to requiring `^24.1.0` (see [Breaking Changes](https://jestjs.io/blog/2019/01/25/jest-24-refreshing-polished-typescript-friendly#breaking-changes), [#13922](https://github.com/WordPress/gutenberg/pull/13922)).
- The bundled `jest-enzyme` dependency has been removed completely ([#13922](https://github.com/WordPress/gutenberg/pull/13922)).

### Internal

- The bundled `enzyme` dependency has been updated from requiring `^3.7.0` to requiring `^3.9.0` ([#13922](https://github.com/WordPress/gutenberg/pull/13922)).
- The bundled `enzyme-adapter-react-16` dependency has been updated from requiring `^1.6.0` to requiring `^1.10.0` ([#13922](https://github.com/WordPress/gutenberg/pull/13922)).

## 3.0.3 (2018-11-20)

## 3.0.2 (2018-11-09)

## 3.0.1 (2018-11-09)

## 3.0.0 (2018-11-03)

### Breaking Change

- Remove coverage support.

## 2.0.0 (2018-07-12)

### Breaking Change

- Updated code to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

- Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.0.6 (2018-05-18)

### Polish

- Fix: Standardized `package.json` format ([#119](https://github.com/WordPress/packages/pull/119))

## 1.0.5 (2018-03-22)

### Polish

- Docs: Wrap filename in backticks ([#89](https://github.com/WordPress/packages/pull/89))
- Add `jest-preset` keyword to `jest-preset-default` package ([#92](https://github.com/WordPress/packages/pull/92))
