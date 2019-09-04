## Master

### Breaking Changes

- Plugin adds now an asset file saved by default in PHP format for each entry point that declares an object with the list of WordPress script dependencies for the entry point ([#17298](https://github.com/WordPress/gutenberg/pull/17298)). There is also an option to use JSON as the output format. The shape of metadata is also different than in the previous version. You can find out more in the [README](./README.md) file.

## 1.0.1 (2019-05-22)

### Bug Fixes

- Fix missing file entry for `util.js` in `package.json`

## 1.0.0 (2019-05-21)

### New Feature

- Introduce the `@wordpress/dependency-extraction-webpack-plugin` package.
