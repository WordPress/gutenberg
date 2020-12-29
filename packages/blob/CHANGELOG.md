<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/master/packages#maintaining-changelogs. -->

## Unreleased

## 2.11.0 (2020-10-19)

### New feature

- Added a new `getBlobTypeByURL` function. Returns the file type of the blob or undefined if not a blob.

## 2.8.0 (2020-04-15)

### New feature

- Include TypeScript type declarations ([#18942](https://github.com/WordPress/gutenberg/pull/18942))

## 2.1.0 (2018-10-19)

### New Features

- Added a new `isBlobURL` function.

## 2.0.3 (2018-10-18)

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
