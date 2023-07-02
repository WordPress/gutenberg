<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 12.13.0 (2023-06-23)

## 12.12.0 (2023-06-07)

## 12.11.0 (2023-05-24)

## 12.10.0 (2023-05-10)

## 12.9.0 (2023-04-26)

## 12.8.0 (2023-04-12)

## 12.7.0 (2023-03-29)

## 12.6.0 (2023-03-15)

## 12.5.0 (2023-03-01)

## 12.4.0 (2023-02-15)

## 12.3.0 (2023-02-01)

## 12.2.0 (2023-01-11)

## 12.1.0 (2023-01-02)

## 12.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

## 11.21.0 (2022-11-16)

## 11.20.0 (2022-11-02)

## 11.19.0 (2022-10-19)

## 11.18.0 (2022-10-05)

### Deprecations

-   Deprecate non-string descriptions ([#44455](https://github.com/WordPress/gutenberg/pull/44455)).

## 11.17.0 (2022-09-21)

- The block attribute sources `children` and `node` have been deprecated. Please use the `html` source instead. See https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/introducing-attributes-and-editable-fields/ and the core blocks for examples.
## 11.16.0 (2022-09-13)

## 11.15.0 (2022-08-24)

### Bug Fix

-   Packages: Replace `is-plain-obj` with `is-plain-object` ([#43511](https://github.com/WordPress/gutenberg/pull/43511)).

## 11.14.0 (2022-08-10)

## 11.13.0 (2022-07-27)

## 11.12.0 (2022-07-13)

### Deprecations

-   `withBlockContentContext` is no longer used by the block editor and therefore got deprecated ([#41395](https://github.com/WordPress/gutenberg/pull/41395)).

### New API

-   The shortcode transformer now accepts a `transform` method to allow advanced controls over the transformed result. For instance, it's now possible to define custom `innerBlocks` for the transformed block. ([#42001](https://github.com/WordPress/gutenberg/pull/42001))

## 11.11.0 (2022-06-29)

## 11.10.0 (2022-06-15)

## 11.9.0 (2022-06-01)

## 11.8.0 (2022-05-18)

## 11.7.0 (2022-05-04)

## 11.6.0 (2022-04-21)

## 11.5.0 (2022-04-08)

## 11.4.0 (2022-03-23)

## 11.3.0 (2022-03-11)

## 11.2.0 (2022-01-27)

## 11.1.0 (2021-09-09)

### Backward Compatibility

-   Register a block even when an invalid value provided for the icon setting ([#34350](https://github.com/WordPress/gutenberg/pull/34350)).

### New API

-   The `isMatch` callback on block transforms now receives the block object (or block objects if `isMulti` is `true`) as its second argument.

## 11.0.0 (2021-07-29)

### Breaking Change

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 10.0.0 (2021-07-21)

### Breaking Changes

-   The deprecated `registerBlockTypeFromMetadata` function was removed. Please use `registerBlockType` that covers the same functionality ([#32030](https://github.com/WordPress/gutenberg/pull/32030)).

## 9.1.0 (2021-05-20)

### New API

-   `registerBlockType` method can be used to register a block type using the metadata loaded from `block.json` file ([#32030](https://github.com/WordPress/gutenberg/pull/32030)).

### Deprecations

-   `registerBlockTypeFromMetadata` was deprecated in favor of `registerBlockType` that support now the same functionality ([#32030](https://github.com/WordPress/gutenberg/pull/32030)).

## 9.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

### New API

-   `registerBlockTypeFromMetadata` method can be used to register a block type using the metadata loaded from `block.json` file ([#30293](https://github.com/WordPress/gutenberg/pull/30293)).

## 8.0.0 (2021-03-17)

### Breaking Change

-   Reverted `cloneBlock` back to its original logic that doesn't sanitize block's attributes. [#28379](https://github.com/WordPress/gutenberg/pull/29111)

## 7.0.0 (2021-02-01)

### Breaking Change

-   `cloneBlock` now sanitizes the attributes to match the same logic `createBlock` has. [#28379](https://github.com/WordPress/gutenberg/pull/28379)

## 6.25.0 (2020-12-17)

### New Feature

-   Added a store definition `store` for the blocks namespace to use with `@wordpress/data` API ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).

## 6.13.0 (2020-04-01)

### New Feature

-   Blocks can now be registered with an `defaultStylePicker` flag in the `supports` setting, allowing the default style picker to be removed.

## 6.4.0 (2019-08-05)

### Improvements

-   Omitting `attributes` or `keywords` settings will now stub default values (an empty object or empty array, respectively).

### Bug Fixes

-   The `'blocks.registerBlockType'` filter is now applied to each of a block's deprecated settings as well as the block's main settings. Ensures `supports` settings like `anchor` work for deprecations.

## 6.3.0 (2019-05-21)

### New Feature

-   Added a default implementation for `save` setting in `registerBlockType` which saves no markup in the post content.
-   Added wildcard block transforms which allows for transforming all/any blocks in another block.

## 6.1.0 (2019-03-06)

### New Feature

-   Blocks' `transforms` will receive `innerBlocks` as the second argument (or an array of each block's respective `innerBlocks` for a multi-transform).

### Bug Fixes

-   Block validation will now correctly validate character references, resolving some issues where a standalone ampersand `&` followed later in markup by a character reference (e.g. `&amp;`) could wrongly mark a block as being invalid. ([#13512](https://github.com/WordPress/gutenberg/pull/13512))

## 6.0.5 (2019-01-03)

## 6.0.4 (2018-12-12)

## 6.0.3 (2018-11-30)

## 6.0.2 (2018-11-21)

## 6.0.1 (2018-11-20)

## 6.0.0 (2018-11-15)

### Breaking Changes

-   `isValidBlock` has been removed. Please use `isValidBlockContent` instead but keep in mind that the order of params has changed.

### Bug Fix

-   The block validator is more lenient toward equivalent encoding forms.

## 5.3.1 (2018-11-12)

## 5.3.0 (2018-11-09)

### New feature

-   `getBlockAttributes`, `getBlockTransforms`, `getSaveContent`, `getSaveElement` and `isValidBlockContent` methods can now take also block's name as the first param ([#11490](https://github.com/WordPress/gutenberg/pull/11490)). Passing a block's type object continues to work as before.
-   `registerBlockStyles` and `unregisterBlockStyles` can be triggered at any moment (before or after block registration).

## 5.2.0 (2018-11-09)

-   Paste: Google Docs: fix nested formatting, sub, sup and del.
-   Expose @wordpress/editor to Gutenberg mobile.
-   Separate Paste Handler.

## 5.1.2 (2018-11-03)

## 5.1.1 (2018-10-30)

## 5.1.0 (2018-10-30)

### New features

-   `isValidBlockContent` function has been added ([#10891](https://github.com/WordPress/gutenberg/pull/10891)).

### Deprecation

-   `isValidBlock` function has been deprecated ([#10891](https://github.com/WordPress/gutenberg/pull/10891)). Use `isValidBlockContent` instead.

## 5.0.0 (2018-10-29)

### Breaking Changes

-   Attribute type coercion has been removed. Omit the source to preserve type via serialized comment demarcation.
-   `setUnknownTypeHandlerName` has been removed. Please use `setFreeformContentHandlerName` and `setUnregisteredTypeHandlerName` instead.
-   `getUnknownTypeHandlerName` has been removed. Please use `getFreeformContentHandlerName` and `getUnregisteredTypeHandlerName` instead.

### New Feature

-   Added a `unregisterBlockStyle()` function to remove a block style variation.

## 4.0.4 (2018-10-19)

## 4.0.3 (2018-10-18)

## 4.0.0 (2018-09-30)

### Breaking Changes

-   `getDefaultBlockForPostFormat` has been removed.

## 3.0.0 (2018-09-05)

### Breaking Changes

-   The `isSharedBlock` function is removed. Use `isReusableBlock` instead.
-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.

### Deprecations

-   The `getDefaultBlockForPostFormat` function has been deprecated.
