<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 12.18.0 (2024-01-24)

- Deprecated `__experimentalRecursionProvider` and `__experimentalUseHasRecursion` in favor of their new stable counterparts `RecursionProvider` and `useHasRecursion`.

## 12.17.0 (2024-01-10)

## 12.16.0 (2023-12-13)

## 12.15.0 (2023-11-29)

## 12.14.0 (2023-11-16)

## 12.13.0 (2023-11-02)

-   Deprecated the `useSetting` function in favor of new `useSettings` one that can retrieve multiple settings at once ([#55337](https://github.com/WordPress/gutenberg/pull/55337)).

## 12.12.0 (2023-10-18)

## 12.11.0 (2023-10-05)

-   Deprecated `CopyHandler`, absorbed into `WritingFlow`.

## 12.10.0 (2023-09-20)

-   The Deprecated multiline prop on RichText will now fall back to using multiple
    rich text instances instead of a single multiline instance. The prop remains
    deprecated.

## 12.9.0 (2023-08-31)

### Enhancements

-   Embed the `ObserveTyping` behavior within the `BlockList` component making to simplify instanciations of third-party block editors.

## 12.8.0 (2023-08-16)

## 12.7.0 (2023-08-10)

## 12.6.0 (2023-07-20)

## 12.5.0 (2023-07-05)

## 12.4.0 (2023-06-23)

### Enhancements

-   Add `HeadingLevelDropdown` component for selecting H1-H6 and paragraph HTML tags from the block toolbar.

### Bug Fix

-   Fluid typography: custom font-sizes should use max viewport width ([#51516](https://github.com/WordPress/gutenberg/pull/51516)).

## 12.3.0 (2023-06-07)

## 12.2.0 (2023-05-24)

## 12.1.0 (2023-05-10)

-   `MediaPlaceholder`: Remove the undocumented `onHTMLDrop` prop ([#49673](https://github.com/WordPress/gutenberg/pull/49673)).

## 12.0.0 (2023-04-26)

### Breaking Changes

-   Renamed utility function `immutableSet` to `setImmutably` ([#50040](https://github.com/WordPress/gutenberg/pull/50040)).

## 11.8.0 (2023-04-12)

## 11.7.0 (2023-03-29)

-   `ImageSizeControl`: Update image size label ([#49112](https://github.com/WordPress/gutenberg/pull/49112)).

## 11.6.0 (2023-03-15)

## 11.5.0 (2023-03-01)

### Bug Fix

-   `SpacingSizesControl`: fix white dot on thumb ([#48574](https://github.com/WordPress/gutenberg/pull/48574)).

## 11.4.0 (2023-02-15)

### Bug Fix

-   `LinkControl`: fix scrollbar displayed on toggle link settings ([#47986](https://github.com/WordPress/gutenberg/pull/47986)).

## 11.3.0 (2023-02-01)

## 11.2.0 (2023-01-11)

### Bug Fix

-   `BlockInspector`: Fix browser warning error when block is not selected ([#46875](https://github.com/WordPress/gutenberg/pull/46875)).
-   Move component styles needed for iframes to content styles ([#47103](https://github.com/WordPress/gutenberg/pull/47103)).
-   Block Inserter: Correctly apply style to the default inserter ([#47166](https://github.com/WordPress/gutenberg/pull/47166)).
-   List View: Fix crash when the first template-parts is deleted width del key ([#47227](https://github.com/WordPress/gutenberg/pull/47227)).

## 11.1.0 (2023-01-02)

## 11.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

### Enhancements

-   `URLInput`: the `renderSuggestions` callback prop now receives `currentInputValue` as a new parameter ([45806](https://github.com/WordPress/gutenberg/pull/45806)).
-   Fluid typography: add configurable fluid typography settings for minimum font size to theme.json ([#42489](https://github.com/WordPress/gutenberg/pull/42489)).
-   `URLInput`: Add `__nextHasNoMarginBottom` prop for opting into the new margin-free styles ([46692](https://github.com/WordPress/gutenberg/pull/46692)).

### Bug Fix

-   `SpacingSizesControl`: Change ARIA role from `region` to `group` to avoid unwanted ARIA landmark regions ([#46530](https://github.com/WordPress/gutenberg/pull/46530)).
-   `FocalPointPicker`: Fix layout misalignment when placed in the `BlockInspector` ([#46631](https://github.com/WordPress/gutenberg/pull/46631)).

## 10.5.0 (2022-11-16)

### Enhancement

-   `BlockLockModal`: Move Icon component out of CheckboxControl label ([#45535](https://github.com/WordPress/gutenberg/pull/45535))
-   Fluid typography: adjust font size min and max rules ([#45536](https://github.com/WordPress/gutenberg/pull/45536)).

## 10.4.0 (2022-11-02)

### Bug Fix

-   `InserterListItem`: Fix dragging and dropping in Firefox. ([#44631](https://github.com/WordPress/gutenberg/pull/44631))

## 10.3.0 (2022-10-19)

### Bug Fix

-   `FontSizePicker`: Update fluid utils so that only string, floats and integers are treated as valid font sizes for the purposes of fluid typography ([#44847](https://github.com/WordPress/gutenberg/pull/44847))
-   `getTypographyClassesAndStyles()`: Ensure that font sizes are transformed into fluid values if fluid typography is activated ([#44852](https://github.com/WordPress/gutenberg/pull/44852))
-   `BlockPopover`: Ensure that padding and margin visualizers display in correct position even when scrolling past block. ([#44998](https://github.com/WordPress/gutenberg/pull/44998))

### New features

-   You can now drop files/blocks/HTML on unmodified default blocks to transform them into corresponding blocks ([#44647](https://github.com/WordPress/gutenberg/pull/44647)).

## 10.2.0 (2022-10-05)

## 10.1.0 (2022-09-21)

## 10.0.0 (2022-09-13)

### Breaking change

-   `FontSizePicker`: Deprecate bottom margin style. Add a `__nextHasNoMarginBottom` prop to start opting into the margin-free styles that will become the default in a future version, currently scheduled to be WordPress 6.4 ([#43870](https://github.com/WordPress/gutenberg/pull/43870)).

## 9.8.0 (2022-08-24)

## 9.7.0 (2022-08-10)

## 9.6.0 (2022-07-27)

## 9.5.0 (2022-07-13)

## 9.4.0 (2022-06-29)

## 9.3.0 (2022-06-15)

### Bug fix

-   Fix focus trap on certain `input` elements when navigating within a block with the left/right arrow keys ([#41538](https://github.com/WordPress/gutenberg/pull/41538)).

## 9.2.0 (2022-06-01)

## 9.1.0 (2022-05-18)

## 9.0.0 (2022-05-04)

### Breaking change

-   `BlockNavigationDropdown` is now deprecated. Use the `Dropdown` component from the `@wordpress/components` package and the `ListView` component from this package ([#40777](https://github.com/WordPress/gutenberg/pull/40777)).
-   `ListView` no longer accepts the `__experimentalFeatures`, `__experimentalPersistentListViewFeatures`, `__experimentalHideContainerBlockActions`, and `showNestedBlocks` props. Passing additional undocumented props through to `ListView` is also now disallowed. ([#40777](https://github.com/WordPress/gutenberg/pull/40777)).

## 8.6.0 (2022-04-21)

## 8.5.0 (2022-04-08)

## 8.4.0 (2022-03-23)

## 8.3.0 (2022-03-11)

## 8.2.0 (2022-02-23)

### New Features

-   `LineHeightControl`: Changes internal implementation to use `NumberControl`, which allows enhanced interactions such as dragging to change the value. To improve consistency with other control components, the bottom margin styles on the component has been deprecated, and will be removed in a future version. To opt into this simplified margin style, set the `__nextHasNoMarginBottom` prop to `true`.

## 8.1.1 (2022-02-10)

### Bug Fix

-   Removed unused `@wordpress/block-serialization-default-parser`, `css-mediaquery`, `memize` and `redux-multi` dependencies ([#38388](https://github.com/WordPress/gutenberg/pull/38388)).

### New Features

-   List View now supports selecting and dragging multiple blocks via `SHIFT` clicking items in the list [#38314](https://github.com/WordPress/gutenberg/pull/38314).

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
