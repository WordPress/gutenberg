<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 2.7.0 (2024-09-05)

## 2.6.0 (2024-08-21)

### New Features

-   Style engine: export util to compile CSS custom var from preset string. ([#64490](https://github.com/WordPress/gutenberg/pull/64490))

## 2.5.0 (2024-08-07)

## 2.4.0 (2024-07-24)

## 2.3.0 (2024-07-10)

## 2.2.0 (2024-06-26)

## 2.1.0 (2024-06-15)

## 2.0.0 (2024-05-31)

### Breaking Changes

-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 1.41.0 (2024-05-16)

## 1.40.0 (2024-05-02)

## 1.39.0 (2024-04-19)

## 1.38.0 (2024-04-03)

## 1.37.0 (2024-03-21)

## 1.36.0 (2024-03-06)

## 1.35.0 (2024-02-21)

## 1.34.0 (2024-02-09)

## 1.33.0 (2024-01-24)

## 1.32.0 (2024-01-10)

## 1.31.0 (2023-12-13)

## 1.30.0 (2023-11-29)

## 1.29.0 (2023-11-16)

## 1.28.0 (2023-11-02)

## 1.27.0 (2023-10-18)

## 1.26.0 (2023-10-05)

## 1.25.0 (2023-09-20)

## 1.24.0 (2023-08-31)

## 1.23.0 (2023-08-16)

## 1.22.0 (2023-08-10)

### Bug Fixes

-   Style engine: switch off optimize by default [#53085](https://github.com/WordPress/gutenberg/pull/53085).

## 1.21.0 (2023-07-20)

## 1.20.0 (2023-07-05)

## 1.19.0 (2023-06-23)

## 1.18.0 (2023-06-07)

## 1.17.0 (2023-05-24)

## 1.16.0 (2023-05-10)

## 1.15.0 (2023-04-26)

## 1.14.0 (2023-04-12)

## 1.13.0 (2023-03-29)

## 1.12.0 (2023-03-15)

## 1.11.0 (2023-03-01)

## 1.10.0 (2023-02-15)

## 1.9.0 (2023-02-01)

## 1.8.0 (2023-01-11)

## 1.7.0 (2023-01-02)

## 1.6.0 (2022-12-14)

## 1.5.0 (2022-11-16)

## 1.4.0 (2022-11-02)

## 1.3.0 (2022-10-19)

### Internal

-   Style Engine: move PHP unit tests to Gutenberg [#44722](https://github.com/WordPress/gutenberg/pull/44722)

## 1.2.0 (2022-10-05)

### Internal

-   Script loader: remove 6.1 wp actions ([#44519](https://github.com/WordPress/gutenberg/pull/44519))

## 1.1.0 (2022-09-21)

### Enhancements

-   Allow for prettified output ([#42909](https://github.com/WordPress/gutenberg/pull/42909)).
-   Enqueue block supports styles in Gutenberg ([#42880](https://github.com/WordPress/gutenberg/pull/42880)).

### Internal

-   Move backend scripts to package ([#39736](https://github.com/WordPress/gutenberg/pull/39736)).
-   Updating docs, formatting, and separating global functions from the main class file ([#43840](https://github.com/WordPress/gutenberg/pull/43840)).

### New Features

-   Add a WP_Style_Engine_Processor object ([#42463](https://github.com/WordPress/gutenberg/pull/42463)).
-   Add a WP_Style_Engine_CSS_Declarations object ([#42043](https://github.com/WordPress/gutenberg/pull/42043)).
-   Add Rules and Store objects ([#42222](https://github.com/WordPress/gutenberg/pull/42222)).
-   Add elements styles support ([#41732](https://github.com/WordPress/gutenberg/pull/41732)) and ([#40987](https://github.com/WordPress/gutenberg/pull/40987)).
-   Add typography and color support ([#40665](https://github.com/WordPress/gutenberg/pull/40987)) and ([#40332](https://github.com/WordPress/gutenberg/pull/40332)).
-   Add border support ([#41803](https://github.com/WordPress/gutenberg/pull/40332)) and ([#40531](https://github.com/WordPress/gutenberg/pull/40531)).
-   Add margin support to frontend ([#39790](https://github.com/WordPress/gutenberg/pull/39790)).
-   Add basic block supports to backend ([#39446](https://github.com/WordPress/gutenberg/pull/39446)).
-   Added initial version of the style engine ([#37978](https://github.com/WordPress/gutenberg/pull/37978)).
-   Include `@wordpress/style-engine` on the list of external dependencies to allow using `wp.styleEngine` global with WordPress 6.1 and beyond ([#43840](https://github.com/WordPress/gutenberg/pull/43840)).
