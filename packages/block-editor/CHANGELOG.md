<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   `LineHeightControl`: Changes internal implementation to use `NumberControl`, which allows enhanced interactions such as dragging to change the value. To improve consistency with other control components, the bottom margin styles on the component has been deprecated, and will be removed in a future version. To opt into this simplified margin style, set the `__nextHasNoMarginBottom` prop to `true`.

## 8.1.1 (2022-02-10)

### Bug Fix

-   Removed unused `@wordpress/block-serialization-default-parser`, `css-mediaquery`, `memize` and `redux-multi` dependencies ([#38388](https://github.com/WordPress/gutenberg/pull/38388)).

## 8.1.0 (2022-01-27)

## 8.0.0 (2021-11-07)

### Performance

-   Avoid re-rendering all List View items on block focus [#35706](https://github.com/WordPress/gutenberg/pull/35706). When List View is open Block focus time is 4 times faster in large posts.
-   Render fixed number of items in List View [#35706](https://github.com/WordPress/gutenberg/pull/35230). Opening List View is 13 times faster in large posts.

### Breaking change

-   List View no longer supports the `showOnlyCurrentHierarchy` flag [#35706](https://github.com/WordPress/gutenberg/pull/35706). To display a subset of blocks, use the `blocks` parameter instead.

## 7.0.0 (2021-07-29)

### Breaking Change

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 6.2.0 (2021-07-21)

### New Features

-   `ButtonBlockerAppender` is now `ButtonBlockAppender`, the original name was a typo, but is still being exported for backward compatibility.

## 6.1.0 (2021-05-20)

## 6.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 5.3.0 (2021-03-17)

-   Add `JustifyToolbar` component abstracted out of the Navigation block so can be used elsewhere.

## 5.2.0 (2020-12-17)

### New Feature

-   Added a store definition `store` for the block editor namespace to use with `@wordpress/data` API ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).

## 5.0.0 (2020-10-06)

### Breaking Changes

-   The block editor does not contain default colors, gradients, and font sizes anymore. If one wants to take advantage of these features, please explicitly pass colors, gradients, and/or settings or use the new \_\_experimentalFeatures setting that is available.

## 4.0.0 (2020-05-28)

### Breaking Changes

-   The block control value for `InnerBlocks` has been changed from `__experimentalBlocks` to `value` and is now considered a stable API.
-   Removed the `utility` property from the objects returned by the `getInserterItems` selector.

## 3.7.0 (2020-02-10)

### New Features

-   Add new `__experimentalEditorSkeleton` component. This has been moved over from the `@wordpress/edit-post` package, where it was an internal component called `EditorRegions`. Its class names have thus been renamed from `edit-post-editor-regions` to `block-editor-editor-skeleton`.

## 3.3.0 (2019-11-14)

### New Features

-   Added a `label` prop to `URLInput`. This allows the label to be set without needing to wrap the `URLInput` in a `BaseControl`.

### Deprecation

-   `dropZoneUIOnly` prop in `MediaPlaceholder` component has been deprecated in favor of `disableMediaButtons` prop.

## 3.0.0 (2019-08-05)

### New Features

-   Added a new `allowedFormats` prop to `RichText` to fine tune allowed formats. Deprecated the `formattingControls` prop in favour of this. Also added a `withoutInteractiveFormatting` to specifically disable format types that would insert interactive elements, which can not be nested.

### Breaking Changes

-   `BlockEditorProvider` no longer renders a wrapping `SlotFillProvider` or `DropZoneProvider` (from `@wordpress/components`). For custom block editors, you should render your own as wrapping the `BlockEditorProvider`. A future release will include a new `BlockEditor` component for simple, standard usage. `BlockEditorProvider` will serve the simple purpose of establishing its own context for block editors.

## 2.2.0 (2019-06-12)

### Internal

-   Refactored `BlockSettingsMenu` to use `DropdownMenu` from `@wordpress/components`.

## 2.0.0 (2019-04-16)

### New Features

-   Added the `addToGallery` property to the `MediaUpload` interface. The property allows users to open the media modal in the `gallery-library`instead of `gallery-edit` state.
-   Added the `addToGallery` property to the `MediaPlaceholder` component. The component passes the property to the `MediaUpload` component used inside the placeholder.
-   Added the `isAppender` property to the `MediaPlaceholder` component. The property changes the look of the placeholder to be adequate to scenarios where new files are added to an already existing set of files, e.g., adding files to a gallery.
-   Added the `dropZoneUIOnly` property to the `MediaPlaceholder` component. The property makes the `MediaPlaceholder` only render a dropzone without any other additional UI.
-   Added a cancel link to the list of buttons in the `MediaPlaceholder` component which appears if an `onCancel` handler exists.
-   Added the usage of `mediaPreview` for the `Placeholder` component to the `MediaPlaceholder` component.
-   Added a an `onDoubleClick` event handler to the `MediaPlaceholder` component.
-   Added a way to pass special `ref` property to the `PlainText` component.
-   The `URLPopover` component now passes through all unhandled props to the underlying Popover component.

### Breaking Changes

-   `CopyHandler` will now only catch cut/copy events coming from its `props.children`, instead of from anywhere in the `document`.

### Internal

-   Improved handling of blocks state references for unchanging states.
-   Updated handling of blocks state to effectively ignored programmatically-received blocks data (e.g. reusable blocks received from editor).

## 1.0.0 (2019-03-06)

### New Features

-   Initial version.
