<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 6.5.0 (2024-08-07)

## 6.4.0 (2024-07-24)

## 6.3.0 (2024-07-10)

## 6.2.0 (2024-06-26)

## 6.1.0 (2024-06-15)

## 6.0.0 (2024-05-31)

### Breaking Changes

**Note** If you're using @wordpress/scripts for building JS scripts to target WordPress 6.5 or earlier, you should not upgrade to this version and continue using @wordpress/dependency-extraction-webpack-plugin@5.

-   Use React's automatic runtime to transform JSX ([#61692](https://github.com/WordPress/gutenberg/pull/61692)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 5.9.0 (2024-05-16)

## 5.8.0 (2024-05-02)

## 5.7.0 (2024-04-19)

## 5.6.0 (2024-04-03)

## 5.5.0 (2024-03-21)

## 5.4.0 (2024-03-06)

## 5.3.0 (2024-02-21)

## 5.2.0 (2024-02-09)

### Bug Fixes

-   Fix import type field in script module asset files ([#58770](https://github.com/WordPress/gutenberg/pull/58770)).

## 5.1.0 (2024-01-24)

## 5.0.0 (2024-01-10)

### Breaking Changes

-   Drop support for webpack 4.
-   Drop support for Node.js versions < 18.

### New Features

-   Add support for producing module-compatible asset files ([#57199](https://github.com/WordPress/gutenberg/pull/57199)).

## 4.31.0 (2023-12-13)

## 4.30.0 (2023-11-29)

## 4.29.0 (2023-11-16)

## 4.28.0 (2023-11-02)

## 4.27.0 (2023-10-18)

## 4.26.0 (2023-10-05)

## 4.25.0 (2023-09-20)

## 4.24.0 (2023-08-31)

## 4.23.0 (2023-08-16)

## 4.22.0 (2023-08-10)

## 4.21.0 (2023-07-20)

## 4.20.0 (2023-07-05)

## 4.19.0 (2023-06-23)

## 4.18.0 (2023-06-07)

## 4.17.0 (2023-05-24)

## 4.16.0 (2023-05-10)

## 4.15.0 (2023-04-26)

## 4.14.0 (2023-04-12)

## 4.13.0 (2023-03-29)

## 4.12.0 (2023-03-15)

## 4.11.0 (2023-03-01)

## 4.10.0 (2023-02-15)

### Bug Fixes

-   The bundled `json2php` dependency has been upgraded from requiring `^0.0.5` to `^0.0.7` ([#47831](https://github.com/WordPress/gutenberg/pull/47831)).

## 4.9.0 (2023-02-01)

## 4.8.0 (2023-01-11)

## 4.7.0 (2023-01-02)

## 4.6.0 (2022-12-14)

## 4.5.0 (2022-11-16)

## 4.4.0 (2022-11-02)

## 4.3.0 (2022-10-19)

## 4.2.0 (2022-10-05)

## 4.1.0 (2022-09-21)

### New Features

-   Include `@wordpress/style-engine` on the list of external dependencies to allow using `wp.styleEngine` global with WordPress 6.1 and beyond ([#43840](https://github.com/WordPress/gutenberg/pull/43840)).

## 4.0.0 (2022-08-24)

### Breaking Changes

-   Increase the minimum Node.js version to 14 ([#43141](https://github.com/WordPress/gutenberg/pull/43141)).

## 3.7.0 (2022-07-13)

### New Features

-   Output asset files for shared chunks, too ([#41002](https://github.com/WordPress/gutenberg/pull/41002)).

## 3.5.0 (2022-05-18)

### Bug Fixes

-   Use OpenSSL provider supported in Node 17+ when calling `crypto.createHash` ([#40503](https://github.com/WordPress/gutenberg/pull/40503)).
-   Add new line at the end of generated `*.asset.php` files ([#40753](https://github.com/WordPress/gutenberg/pull/40753)).
-   Calculate version hashes based on output file contents rather than input files and other Webpack internal state ([#34969](https://github.com/WordPress/gutenberg/pull/34969)).

## 3.3.0 (2022-01-27)

-   Add the optional `externalizedReportFile` option ([#35106](https://github.com/WordPress/gutenberg/pull/35106)).

## 3.0.0 (2021-01-21)

### Breaking Changes

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).

## 2.9.0 (2020-12-17)

### New Features

-   Make the plugin compatible with webpack 5.

## 2.7.0 (2020-06-15)

### New Features

-   Include TypeScript type declarations ([#22498](https://github.com/WordPress/gutenberg/pull/22498))

## 2.5.0 (2020-04-01)

### New Features

-   The plugin now supports an optional `combinedOutputFile` option that is useful only when another `combineAssets` option is enabled. It allows providing a custom output file for the generated single assets file ([#20844](https://github.com/WordPress/gutenberg/pull/20844)).

## 2.3.0 (2020-02-21)

### New Features

-   The plugin now supports optional `combineAssets` option. When this flag is set to `true`, all information about assets is combined into a single `assets.(json|php)` file generated in the output directory ([#20330](https://github.com/WordPress/gutenberg/pull/20330)).

## 2.0.0 (2019-09-16)

### Breaking Changes

-   The plugin now adds, for each entry point, an asset file saved by default in PHP format that declares an object with the list of WordPress script dependencies for the entry point ([#17298](https://github.com/WordPress/gutenberg/pull/17298)). There is also an option to use JSON as the output format. The shape of metadata is also different from the previous version. Note that the file name has also changed from `*.deps.json` to `*.asset.json` or `*.asset.php`. References to the `*.deps.json` filename will need to be updated, even if you choose to use the JSON formatted file. Read more in the [README](./README.md) file.

## 1.0.1 (2019-05-22)

### Bug Fixes

-   Fix missing file entry for `util.js` in `package.json`

## 1.0.0 (2019-05-21)

### New Features

-   Introduce the `@wordpress/dependency-extraction-webpack-plugin` package.
