<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 12.8.0 (2024-09-19)

## 12.7.0 (2024-09-05)

## 12.6.0 (2024-08-21)

## 12.5.0 (2024-08-07)

## 12.4.0 (2024-07-24)

## 12.3.0 (2024-07-10)

## 12.2.0 (2024-06-26)

## 12.1.0 (2024-06-15)

## 12.0.0 (2024-05-31)

### Breaking Changes

-   Variables like `process.env.IS_GUTENBERG_PLUGIN` have been replaced by `globalThis.IS_GUTENBERG_PLUGIN`. Build systems using `process.env` should be updated ([#61486](https://github.com/WordPress/gutenberg/pull/61486)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 11.29.0 (2024-05-16)

## 11.28.0 (2024-05-02)

## 11.27.0 (2024-04-19)

## 11.26.0 (2024-04-03)

## 11.25.0 (2024-03-21)

## 11.24.0 (2024-03-06)

## 11.23.0 (2024-02-21)

## 11.22.0 (2024-02-09)

## 11.21.0 (2024-01-24)

## 11.20.0 (2024-01-10)

## 11.19.0 (2023-12-13)

## 11.18.0 (2023-11-29)

## 11.17.0 (2023-11-16)

## 11.16.0 (2023-11-02)

## 11.15.0 (2023-10-18)

## 11.14.0 (2023-10-05)

## 11.13.0 (2023-09-20)

## 11.12.0 (2023-08-31)

## 11.11.0 (2023-08-16)

## 11.10.0 (2023-08-10)

## 11.9.0 (2023-07-20)

## 11.8.0 (2023-07-05)

## 11.7.0 (2023-06-23)

## 11.6.0 (2023-06-07)

## 11.5.0 (2023-05-24)

## 11.4.0 (2023-05-10)

## 11.3.0 (2023-04-26)

## 11.2.0 (2023-04-12)

## 11.1.0 (2023-03-29)

## 11.0.0 (2023-03-15)

### Breaking Changes

-   Started requiring Jest v29 instead of v27 as a peer dependency. See [breaking changes in Jest 28](https://jestjs.io/blog/2022/04/25/jest-28) and [in jest 29](https://jestjs.io/blog/2022/08/25/jest-29) ([#47388](https://github.com/WordPress/gutenberg/pull/47388))

## 10.9.0 (2023-03-01)

## 10.8.0 (2023-02-15)

## 10.7.0 (2023-02-01)

## 10.6.0 (2023-01-11)

## 10.5.0 (2023-01-02)

## 10.4.0 (2022-12-14)

## 10.3.0 (2022-11-16)

## 10.2.0 (2022-11-02)

## 10.1.0 (2022-10-19)

## 10.0.0 (2022-10-05)

### Breaking Changes

-   Testing: Remove enzyme completely ([#44494](https://github.com/WordPress/gutenberg/pull/44494)). See the [example in the README](./README.md#using-enzyme) for instructions on how to continue using `enzyme` in your project.

## 9.1.0 (2022-09-21)

## 9.0.0 (2022-08-24)

### Breaking Changes

-   Increase the minimum Node.js version to 14 ([#43141](https://github.com/WordPress/gutenberg/pull/43141)).

### Bug Fixes

-   Packages: Replace `is-plain-obj` with `is-plain-object` ([#43511](https://github.com/WordPress/gutenberg/pull/43511)).

## 8.5.2 (2022-08-17)

### Bug Fixes

-   Jest Preset: Improve `is-plain-obj` transformation ignore ([#43271](https://github.com/WordPress/gutenberg/pull/43271)).

## 8.5.1 (2022-08-12)

### Bug Fixes

-   Jest Preset: Ignore `is-plain-obj` transformation ([#43179](https://github.com/WordPress/gutenberg/pull/43179)).

## 8.0.0 (2022-01-27)

### Breaking Changes

-   The peer `jest` dependency has been updated from requiring `>=26` to requiring `>=27` (see [Breaking Changes](https://jestjs.io/blog/2021/05/25/jest-27), [#33287](https://github.com/WordPress/gutenberg/pull/33287)).

### Bug Fixes

-   Allow ESLint to be imported from within Jest (e.g. when using `ruleTester`) ([#36283](https://github.com/WordPress/gutenberg/pull/36283)).
-   Improve support for test files with `.jsx` and `.tsx` extensions ([#36260](https://github.com/WordPress/gutenberg/pull/36260)).

## 7.1.2 (2021-10-22)

### Bug Fixes

-   Provide more complete mocks of browser timing functions. ([#35368](https://github.com/WordPress/gutenberg/pull/35368))

## 7.1.1 (2021-09-09)

### Bug Fixes

-   Restore the default setting for the `verbose` option. In effect, each test won't get reported during the run ([#34327](https://github.com/WordPress/gutenberg/pull/34327)).

## 7.0.0 (2021-01-21)

### Breaking Changes

-   The peer `jest` dependency has been updated from requiring `>=25` to requiring `>=26` (see [Breaking Changes](https://jestjs.io/blog/2020/05/05/jest-26), [#27956](https://github.com/WordPress/gutenberg/pull/27956)).

## 6.5.0 (2020-10-30)

### Enhancements

-   Ignore `/vendor` folder when searching for tests.

## 6.0.0 (2020-04-15)

### Breaking Changes

-   The peer `jest` dependency has been updated from requiring `>=24` to requiring `>=25` (see [Breaking Changes](https://jestjs.io/blog/2020/01/21/jest-25), [#20766](https://github.com/WordPress/gutenberg/pull/20766)).
-   This package requires now `node` v10.0.0 or later ([#20766](https://github.com/WordPress/gutenberg/pull/20766)).

## 5.4.0 (2020-02-04)

### Bug Fixes

-   Use `require.resolve()` instead of `<rootDir>` to resolve `jest` config files according to the NodeJS lookup algorithm. ([#19957](https://github.com/WordPress/gutenberg/pull/19957))

## 5.3.1 (2020-01-01)

### Bug Fixes

-   Fix preset file extension for inclusion in NPM deployments. ([#19306](https://github.com/WordPress/gutenberg/pull/19306)).

## 5.3.0 (2019-12-20)

### New Features

-   Added support to collapse or omit successful test results from Travis CI builds ([#16744](https://github.com/WordPress/gutenberg/issues/16744))

## 5.2.0 (2019-11-15)

## 5.1.0 (2019-09-03)

### Bug Fixes

-   Add `wordpress` folder to the list of ignored paths ([#17296](https://github.com/WordPress/gutenberg/pull/17296)).

## 5.0.0 (2019-08-29)

### Breaking Changes

-   Files with `.spec.js` suffix are no longer matched as test files by default.

### New Features

-   Align `testMatch` config option with Jest and allow test files with `.ts` suffix.

## 4.0.0 (2019-03-06)

### Breaking Changes

-   The bundled `jest` dependency has been updated from requiring `^23.6.0` to requiring `^24.1.0` (see [Breaking Changes](https://jestjs.io/blog/2019/01/25/jest-24-refreshing-polished-typescript-friendly#breaking-changes), [#13922](https://github.com/WordPress/gutenberg/pull/13922)).
-   The bundled `jest-enzyme` dependency has been removed completely ([#13922](https://github.com/WordPress/gutenberg/pull/13922)).

### Internal

-   The bundled `enzyme` dependency has been updated from requiring `^3.7.0` to requiring `^3.9.0` ([#13922](https://github.com/WordPress/gutenberg/pull/13922)).
-   The bundled `enzyme-adapter-react-16` dependency has been updated from requiring `^1.6.0` to requiring `^1.10.0` ([#13922](https://github.com/WordPress/gutenberg/pull/13922)).

## 3.0.3 (2018-11-20)

## 3.0.2 (2018-11-09)

## 3.0.1 (2018-11-09)

## 3.0.0 (2018-11-03)

### Breaking Changes

-   Remove coverage support.

## 2.0.0 (2018-07-12)

### Breaking Changes

-   Updated code to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

-   Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.0.6 (2018-05-18)

### Internal

-   Fix: Standardized `package.json` format ([#119](https://github.com/WordPress/packages/pull/119))

## 1.0.5 (2018-03-22)

### Internal

-   Docs: Wrap filename in backticks ([#89](https://github.com/WordPress/packages/pull/89))
-   Add `jest-preset` keyword to `jest-preset-default` package ([#92](https://github.com/WordPress/packages/pull/92))
