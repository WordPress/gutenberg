## 2.0.0 (2019-09-16)

### Breaking Changes

- The plugin now adds, for each entry point, an asset file saved by default in PHP format that declares an object with the list of WordPress script dependencies for the entry point ([#17298](https://github.com/WordPress/gutenberg/pull/17298)). There is also an option to use JSON as the output format. The shape of metadata is also different from the previous version. Note that the file name has also changed from `*.deps.json` to `*.asset.json` or `*.asset.php`. References to the `*.deps.json` filename will need to be updated, even if you choose to use the JSON formatted file. Read more in the [README](./README.md) file.

## 1.0.1 (2019-05-22)

### Bug Fixes

- Fix missing file entry for `util.js` in `package.json`

## 1.0.0 (2019-05-21)

### New Feature

- Introduce the `@wordpress/dependency-extraction-webpack-plugin` package.
