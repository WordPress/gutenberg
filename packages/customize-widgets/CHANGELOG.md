<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 5.5.0 (2024-08-07)

## 5.4.0 (2024-07-24)

## 5.3.0 (2024-07-10)

## 5.2.0 (2024-06-26)

## 5.1.0 (2024-06-15)

## 5.0.0 (2024-05-31)

### Breaking Changes

-   Variables like `process.env.IS_GUTENBERG_PLUGIN` have been replaced by `globalThis.IS_GUTENBERG_PLUGIN`. Build systems using `process.env` should be updated ([#61486](https://github.com/WordPress/gutenberg/pull/61486)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 4.35.0 (2024-05-16)

## 4.34.0 (2024-05-02)

## 4.33.0 (2024-04-19)

## 4.32.0 (2024-04-03)

## 4.31.0 (2024-03-21)

## 4.30.0 (2024-03-06)

## 4.29.0 (2024-02-21)

## 4.28.0 (2024-02-09)

## 4.27.0 (2024-01-24)

## 4.26.0 (2024-01-10)

## 4.25.0 (2023-12-13)

## 4.24.0 (2023-11-29)

## 4.23.0 (2023-11-16)

## 4.22.0 (2023-11-02)

## 4.21.0 (2023-10-18)

## 4.20.0 (2023-10-05)

## 4.19.0 (2023-09-20)

## 4.18.0 (2023-08-31)

## 4.17.0 (2023-08-16)

## 4.16.0 (2023-08-10)

## 4.15.0 (2023-07-20)

## 4.14.0 (2023-07-05)

## 4.13.0 (2023-06-23)

## 4.12.0 (2023-06-07)

## 4.11.0 (2023-05-24)

## 4.10.0 (2023-05-10)

## 4.9.0 (2023-04-26)

## 4.8.0 (2023-04-12)

## 4.7.0 (2023-03-29)

## 4.6.0 (2023-03-15)

## 4.5.0 (2023-03-01)

## 4.4.0 (2023-02-15)

## 4.3.0 (2023-02-01)

## 4.2.0 (2023-01-11)

## 4.1.0 (2023-01-02)

## 4.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

## 3.19.0 (2022-11-16)

## 3.18.0 (2022-11-02)

## 3.17.0 (2022-10-19)

## 3.16.0 (2022-10-05)

## 3.15.0 (2022-09-21)

## 3.14.0 (2022-09-13)

## 3.13.0 (2022-08-24)

## 3.12.0 (2022-08-10)

## 3.11.0 (2022-07-27)

## 3.10.0 (2022-07-13)

## 3.9.0 (2022-06-29)

## 3.8.0 (2022-06-15)

## 3.7.0 (2022-06-01)

## 3.6.0 (2022-05-18)

## 3.5.0 (2022-05-04)

## 3.4.0 (2022-04-21)

## 3.3.0 (2022-04-08)

## 3.2.0 (2022-03-23)

## 3.1.0 (2022-03-11)

## 3.0.0 (2022-02-10)

### Breaking Changes

-   The `GUTENBERG_PHASE` environment variable has been renamed to `IS_GUTENBERG_PLUGIN` and is now a boolean ([#38202](https://github.com/WordPress/gutenberg/pull/38202)).

### Bug Fixes

-   Removed unused `@wordpress/a11y` dependency ([#38388](https://github.com/WordPress/gutenberg/pull/38388)).

## 2.1.0 (2022-01-27)

## 2.0.0 (2021-07-29)

### Breaking Changes

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 1.1.0 (2021-07-21)

## 1.0.0 (2021-05-24)

-   Initial release of the package.
