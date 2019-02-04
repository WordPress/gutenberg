## 2.3.0 (Unreleased)

### New Feature

- Add background color controls for the table block.
- Add new `RSS` block ([#7966](https://github.com/WordPress/gutenberg/pull/7966)).

## 2.2.12 (2019-01-03)

## 2.2.11 (2018-12-18)

## 2.2.10 (2018-12-12)

## 2.2.9 (2018-11-30)

## 2.2.8 (2018-11-30)

## 2.2.7 (2018-11-22)

## 2.2.6 (2018-11-21)

## 2.2.5 (2018-11-20)

## 2.2.4 (2018-11-15)

## 2.2.3 (2018-11-12)

### Bug Fixes

- Add a minimum width for the audio block to fixed floated audio blocks.

## 2.2.2 (2018-11-12)

### Polish

- Columns Block: Improve usability while editing columns.

## 2.2.1 (2018-11-09)

## 2.2.0 (2018-11-09)

### New Features

- Gallery Block: Add screen reader support for order of images in gallery.

## 2.1.8 (2018-11-03)

### Polish

- File Block: Create file blocks when dropping multiple files at once.

## 2.1.7 (2018-10-30)

## 2.1.6 (2018-10-30)

### Bug Fixes

- Classic Block: Prevent theme styles from italicising the italicise button.
- Gallery Block: Fix the "Remove Image" button appearing blank when an image is focussed.

## 2.1.5 (2018-10-29)

## 2.1.4 (2018-10-22)

### Bug Fixes

- Video Block: Set correct media types for the poster image.

## 2.1.3 (2018-10-19)

## 2.1.2 (2018-10-18)

## 2.1.0 (2018-10-10)

### New Features

- Include the classic block if `wp.oldEditor` is defined.
- Include the HTML block.

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.

### Deprecations

- Attribute type coercion has been deprecated. Omit the source to preserve type via serialized comment demarcation.
