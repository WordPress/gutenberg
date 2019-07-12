## Master

### New Features

- `parse` now accepts an options object. Current options include the ability to disable default validation (`validate`).
- New function: `validate`. Given a block or array of blocks, assigns the `isValid` property of each block corresponding to the validation result.

### Improvements

- Omitting `attributes` or `keywords` settings will now stub default values (an empty object or empty array, respectively).

### Bug Fixes

- The `'blocks.registerBlockType'` filter is now applied to each of a block's deprecated settings as well as the block's main settings. Ensures `supports` settings like `anchor` work for deprecations.

## 6.3.0 (2019-05-21)

### New Feature

- Added a default implementation for `save` setting in `registerBlockType` which saves no markup in the post content.
- Added wildcard block transforms which allows for transforming all/any blocks in another block.

## 6.1.0 (2019-03-06)

### New Feature

- Blocks' `transforms` will receive `innerBlocks` as the second argument (or an array of each block's respective `innerBlocks` for a multi-transform).

### Bug Fixes

- Block validation will now correctly validate character references, resolving some issues where a standalone ampersand `&` followed later in markup by a character reference (e.g. `&amp;`) could wrongly mark a block as being invalid. ([#13512](https://github.com/WordPress/gutenberg/pull/13512))

## 6.0.5 (2019-01-03)

## 6.0.4 (2018-12-12)

## 6.0.3 (2018-11-30)

## 6.0.2 (2018-11-21)

## 6.0.1 (2018-11-20)

## 6.0.0 (2018-11-15)

### Breaking Changes

- `isValidBlock` has been removed. Please use `isValidBlockContent` instead but keep in mind that the order of params has changed.

### Bug Fix

- The block validator is more lenient toward equivalent encoding forms.

## 5.3.1 (2018-11-12)

## 5.3.0 (2018-11-09)

### New feature

- `getBlockAttributes`, `getBlockTransforms`, `getSaveContent`, `getSaveElement` and `isValidBlockContent` methods can now take also block's name as the first param ([#11490](https://github.com/WordPress/gutenberg/pull/11490)). Passing a block's type object continues to work as before.
- `registerBlockStyles` and `unregisterBlockStyles` can be triggered at any moment (before or after block registration).

## 5.2.0 (2018-11-09)

- Paste: Google Docs: fix nested formatting, sub, sup and del.
- Expose @wordpress/editor to Gutenberg mobile.
- Separate Paste Handler.

## 5.1.2 (2018-11-03)

## 5.1.1 (2018-10-30)

## 5.1.0 (2018-10-30)

### New features

- `isValidBlockContent` function has been added ([#10891](https://github.com/WordPress/gutenberg/pull/10891)).

### Deprecation

- `isValidBlock` function has been deprecated ([#10891](https://github.com/WordPress/gutenberg/pull/10891)). Use `isValidBlockContent` instead.

## 5.0.0 (2018-10-29)

### Breaking Changes

- Attribute type coercion has been removed. Omit the source to preserve type via serialized comment demarcation.
- `setUnknownTypeHandlerName` has been removed. Please use `setFreeformContentHandlerName` and `setUnregisteredTypeHandlerName` instead.
- `getUnknownTypeHandlerName` has been removed. Please use `getFreeformContentHandlerName` and `getUnregisteredTypeHandlerName` instead.

### New Feature

- Added a `unregisterBlockStyle()` function to remove a block style variation.

## 4.0.4 (2018-10-19)

## 4.0.3 (2018-10-18)

## 4.0.0 (2018-09-30)

### Breaking Changes

- `getDefaultBlockForPostFormat` has been removed.

## 3.0.0 (2018-09-05)

### Breaking Changes

- The `isSharedBlock` function is removed. Use `isReusableBlock` instead.
- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.

### Deprecations

- The `getDefaultBlockForPostFormat` function has been deprecated.
