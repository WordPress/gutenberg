<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 3.0.0 (2021-01-21)

### Breaking Changes

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).

## 2.9.0 (2020-12-17)

### New feature

-   Make the plugin compatible with webpack 5.

## 2.7.0 (2020-06-15)

### New feature

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

### New Feature

-   Introduce the `@wordpress/dependency-extraction-webpack-plugin` package.
