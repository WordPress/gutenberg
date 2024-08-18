<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 2.5.0 (2024-08-07)

## 2.4.0 (2024-07-24)

## 2.3.0 (2024-07-10)

## 2.2.0 (2024-06-26)

## 2.1.0 (2024-06-15)

## 2.0.0 (2024-05-31)

### Breaking Changes

-   Variables like `process.env.IS_GUTENBERG_PLUGIN` have been replaced by `globalThis.IS_GUTENBERG_PLUGIN`. Build systems using `process.env` should be updated ([#61486](https://github.com/WordPress/gutenberg/pull/61486)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 1.8.0 (2024-05-16)

## 1.7.0 (2024-05-02)

## 1.6.0 (2024-04-19)

## 1.5.0 (2024-04-03)

## 1.4.0 (2024-03-21)

## 1.3.0 (2024-03-06)

### Bug Fixes

-   Fix navigate() issues related to initial state merges. ([#57134](https://github.com/WordPress/gutenberg/pull/57134))

## 1.2.0 (2024-02-21)

## 1.1.0 (2024-02-09)

### New Features

-   Add the `clientNavigationDisabled` option to the `core/router` config. ([58749](https://github.com/WordPress/gutenberg/pull/58749))

## 1.0.0 (2024-01-24)

### Breaking Changes

-   Initial version. ([57924](https://github.com/WordPress/gutenberg/pull/57924))
