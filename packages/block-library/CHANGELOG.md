## 2.12.0 (2020-01-13)

### Bug Fixes

- Fixes a regression published in version 2.9.2 that would prevent some build tools from including
  styles provided in the packages build-styles directory.

## 2.7.0 (2019-08-05)

### Enhancements

- Heading block uses `has-text-align-*` class names rather than inline style for text alignment.
- Verse block uses `has-text-align-*` class names rather than inline style for text alignment.

### Bug Fixes

- Fixed insertion of columns in the table block, which now inserts columns for all table sections ([#16410](https://github.com/WordPress/gutenberg/pull/16410))

## 2.6.0 (2019-06-12)

- Fixed an issue with creating upgraded embed blocks that are not registered ([#15883](https://github.com/WordPress/gutenberg/issues/15883)).

## 2.5.0 (2019-05-21)

- Add vertical alignment controls to Columns Block ([#13899](https://github.com/WordPress/gutenberg/pull/13899/)).
- Add vertical alignment controls to Media & Text Block ([#13989](https://github.com/WordPress/gutenberg/pull/13989)).
- Add `wide` and `full` alignments to Archives block ([#14533](https://github.com/WordPress/gutenberg/pull/14533)).
- Add `wide` and `full` alignments to Categories block ([#14533](https://github.com/WordPress/gutenberg/pull/14533)).
- Add all alignment options to RSS block ([#14533](https://github.com/WordPress/gutenberg/pull/14533)).
- Add all alignment options to Search block ([#14533](https://github.com/WordPress/gutenberg/pull/14533)).
- Add image fill option and focal point picker to Media & Text block ([#14445](https://github.com/WordPress/gutenberg/pull/14445)).
- Updated the edit flow of the `image` block, updated the edit icon and unified the image editing in only one UI based on `MediaPlaceholder`

### Bug Fixes

- fix uncaught error in `columns` block due to accessing a property on an object that might be undefined [#14605](https://github.com/WordPress/gutenberg/pull/14605)

## 2.3.0 (2019-03-06)

### New Feature

- Add background color controls for the table block.
- Add new `RSS` block ([#7966](https://github.com/WordPress/gutenberg/pull/7966)).
- Add new `Search` block ([#13583](https://github.com/WordPress/gutenberg/pull/13583)).

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
