## Master

### New Features

- Add SVGR support to compile SVG files to React components using the `@svgr/webpack` plugin.  [#18243](https://github.com/WordPress/gutenberg/pull/18243)

## 6.1.1 (2020-01-01)

### Bug Fixes

- Update `jest-preset-default` dependency to fix preset file extension for inclusion in NPM deployments. ([#19306](https://github.com/WordPress/gutenberg/pull/19306)).

## 6.1.0 (2019-12-20)

### New Features

- Added support to collapse or omit successful test results from Travis CI builds ([#16744](https://github.com/WordPress/gutenberg/issues/16744))

## 6.0.0 (2019-11-14)

### Breaking Changes

- The bundled `npm-package-json-lint` dependency has been updated from requiring `^3.6.0` to requiring `^4.0.3` ([#18054](https://github.com/WordPress/gutenberg/pull/18054)). Please see the [migration guide](https://npmpackagejsonlint.org/docs/en/v3-to-v4). Note: `npmPackageJsonLintConfig` prop in the `package.json` file needs to be renamed to `npmpackagejsonlint`.
- The bundled `puppeteer` dependency has been updated from requiring `^1.19.0` to requiring `^2.0.0` ([#18205](https://github.com/WordPress/gutenberg/pull/18205)). It uses Chromium v79 instead of Chromium v77. See the [full list of changes](https://github.com/GoogleChrome/puppeteer/releases/tag/v2.0.0).

## 5.1.0

### New Features

- The bundled `webpack` dependency has been updated from requiring `4.8.3` to requiring `^4.41.0` ([#17746](https://github.com/WordPress/gutenberg/pull/17746)).

### Bug Fixes

- Added a temporary workaround for the default config used with `lint-js` command. It uses linting rules for both e2e and unit tests with all files until override files globbing logic is fixed when using `eslint` with `--config` (related [issue](https://github.com/eslint/eslint/issues/11558)).

## 5.0.0 (2019-09-16)

### Breaking Changes

- The bundled `@wordpress/dependency-extraction-webpack-plugin` dependency has been updated to the next major version `^2.0.0`. `start` and `build` scripts save now the generated asset file for each entry point in the new PHP output format.

## 4.1.0 (2019-09-03)

### New Features

- Add the new `env` family of scripts [(#17004](https://github.com/WordPress/gutenberg/pull/17004/)).

### Bug Fixes

- Add `wordpress` folder to the list of ignored paths in all applicable config files ([#17296](https://github.com/WordPress/gutenberg/pull/17296)).

## 4.0.0 (2019-08-29)

### Breaking Changes

- Test files matching has changed to fix the overlap between two types of tests implemented with `test-e2e` and `test-unit`. Refer to the documentation of the corresponding scripts to learn about new file discovery rules.

### New Features

- The bundled `puppeteer` dependency has been updated from requiring `1.6.1` to requiring `^1.19.0` ([#16875](https://github.com/WordPress/gutenberg/pull/16875)). It uses Chromium v77 instead of Chromium v69.
- The bundled `jest-puppeteer` dependency has been updated from requiring `^4.0.0` to requiring `^4.3.0` ([#16875](https://github.com/WordPress/gutenberg/pull/16875)).
- The bundled `eslint` dependency has been updated from requiring `^5.16.0` to requiring `^6.1.0`.
- The bundled `@wordpress/eslint-plugin` dependency has been updated to the next major version `^3.0.0` due to new ESLint rules enabled for all test files.

### Bug Fix

- Use the SCSS shared `stylelint-config-wordpress` config so that both CSS and SCSS rules are used ([#17060](https://github.com/WordPress/gutenberg/pull/17060))

## 3.4.0 (2019-08-05)

### New Features

- The `build` and `start` commands supports simplified syntax for multiple entry points: `wp-scripts build entry-one.js entry-two.js` ([15982](https://github.com/WordPress/gutenberg/pull/15982)).

### Bug Fix

- Added missing [babel-jest](https://www.npmjs.com/package/babel-jest) dependency ([#16259](https://github.com/WordPress/gutenberg/pull/16259)).

## 3.3.0 (2019-06-12)

### New Features

- The `lint-js` command lints now JS files in the entire project's directories by default ([15890](https://github.com/WordPress/gutenberg/pull/15890)).
- The `lint-pkg-json` command lints now `package.json` files in the entire project's directories by default ([15890](https://github.com/WordPress/gutenberg/pull/15890)).
- The `lint-style` command lints now CSS and SCSS files in the entire project's directories by default ([15890](https://github.com/WordPress/gutenberg/pull/15890)).
- The `lint-js`, `lint-pkg-json` and `lint-style` commands ignore now files located in `build` and `node_modules` folders by default ([15977](https://github.com/WordPress/gutenberg/pull/15977)).

## 3.2.0 (2019-05-21)

### New Features

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
