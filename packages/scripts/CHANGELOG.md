## 3.3.0 (2019-06-12)

### New Features

- The `lint-js` command lints now JS files in the entire project's directories by default ([15890](https://github.com/WordPress/gutenberg/pull/15890)).
- The `lint-pkg-json` command lints now `package.json` files in the entire project's directories by default ([15890](https://github.com/WordPress/gutenberg/pull/15890)).
- The `lint-style` command lints now CSS and SCSS files in the entire project's directories by default ([15890](https://github.com/WordPress/gutenberg/pull/15890)).
- The `lint-js`, `lint-pkg-json` and `lint-style` commands ignore now files located in `build` and `node_modules` folders by default ([15977](https://github.com/WordPress/gutenberg/pull/15977)).

## 3.2.0 (2019-05-21)

### New Feature

- Leverage `@wordpress/dependency-extraction-webpack-plugin` plugin to extract WordPress
  dependencies.
- The bundled `eslint` dependency has been updated from requiring `^5.12.1` to requiring `^5.16.0`.

### Enhancements

- The default Webpack configuration uses [`thread-loader`](https://github.com/webpack-contrib/thread-loader) to parallelize Babel processing.
- The default Webpack configuration now opts-in to [the `cacheDirectory` option](https://webpack.js.org/loaders/babel-loader/#options) for its Babel loader.
- The `source-map-loader` is excluded from production builds. This serves only as an optimization and should otherwise have no impact on build results.

## 3.1.0 (2019-03-20)

## New features

- The `build` and `start` commands will use a default webpack config if none is provided.

## 3.0.0 (2019-03-06)

### Breaking Changes

- The bundled `eslint` dependency has been updated from requiring `^4.19.1` to requiring `^5.12.1` (see [Migration Guide](https://eslint.org/docs/user-guide/migrating-to-5.0.0)).
- The bundled `jest` dependency has been updated from requiring `^23.6.0` to requiring `^24.1.0` (see [Breaking Changes](https://jestjs.io/blog/2019/01/25/jest-24-refreshing-polished-typescript-friendly#breaking-changes), [#13922](https://github.com/WordPress/gutenberg/pull/13922)).
- The bundled `jest-puppeteer` dependency has been updated from requiring `3.2.1` to requiring `^4.0.0` ([#13922](https://github.com/WordPress/gutenberg/pull/13922)).

### New Features

- Added support for `build` script ([#12837](https://github.com/WordPress/gutenberg/pull/12837))
- Added support for `start` script ([#12837](https://github.com/WordPress/gutenberg/pull/12837))
- Updated `npm-package-json-lint` dependency [#14200](https://github.com/WordPress/gutenberg/pull/14200)

### Bug Fix

- Avoid inheriting from ESLint configurations in ancestor directories when using the default configuration ([#13483](https://github.com/WordPress/gutenberg/pull/13483))

## 2.5.0 (2019-01-09)

### New Features

- Added support for `check-engines` script ([#12721](https://github.com/WordPress/gutenberg/pull/12721))
- Added support for `lint-style` script ([#12722](https://github.com/WordPress/gutenberg/pull/12722))
- Added support for `test-e2e` script ([#12437](https://github.com/WordPress/gutenberg/pull/12437))
- Update default config provided for `lint-js` script ([#12845](https://github.com/WordPress/gutenberg/pull/12845))

## 2.4.4 (2018-11-20)

## 2.4.3 (2018-11-09)

## 2.4.2 (2018-11-09)

## 2.4.1 (2018-11-03)

## 2.4.0 (2018-10-16)

### New Feature

- Added support for `lint-js` script ([#10504](https://github.com/WordPress/gutenberg/pull/10504))

## 2.3.0 (2018-09-30)

### Improvements

- New flag `--ignore` for `check-licenses` script
- Try deferring to LICENSE file for `license` fields which include filename
- Add "BSD-3-Clause-W3C" as GPL-compatible

## 2.2.1 (2018-09-05)

### Bug Fix

- Resolves an issue where npm package lint script did not work in Windows environments ([#9321](https://github.com/WordPress/gutenberg/pull/9321)

### Polish

- Updated dependencies: `jest`, `npm-package-json-lint` and `read-pkg-up`

## 2.0.0 (2018-07-12)

### Breaking Change

- Updated code to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

- Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.2.0 (2018-05-29)

### New Feature

- Added support for `lint-pkg-json` script ([#128](https://github.com/WordPress/packages/pull/128))

## 1.1.5 (2018-05-18)

### Polish

- Fix: Standardized `package.json` format ([#119](https://github.com/WordPress/packages/pull/119))
