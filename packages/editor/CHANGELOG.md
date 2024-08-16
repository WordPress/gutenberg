<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 14.5.0 (2024-08-07)

## 14.4.0 (2024-07-24)

### Deprecations

-   `PostTaxonomiesFlatTermSelector`: Deprecate bottom margin. Add a `__nextHasNoMarginBottom` prop to start opting into the margin-free styles that will become the default in a future version, currently scheduled to be WordPress 7.0 ([#63491](https://github.com/WordPress/gutenberg/pull/63491)).

## 14.3.0 (2024-07-10)

## 14.2.0 (2024-06-26)

## 14.1.0 (2024-06-15)

## 14.0.0 (2024-05-31)

### Breaking Changes

-   Variables like `process.env.IS_GUTENBERG_PLUGIN` have been replaced by `globalThis.IS_GUTENBERG_PLUGIN`. Build systems using `process.env` should be updated ([#61486](https://github.com/WordPress/gutenberg/pull/61486)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 13.35.0 (2024-05-16)

### Internal

-   Replaced `classnames` package with the faster and smaller `clsx` package ([#61138](https://github.com/WordPress/gutenberg/pull/61138)).

## 13.34.0 (2024-05-02)

## 13.33.0 (2024-04-19)

## 13.32.0 (2024-04-03)

## 13.31.0 (2024-03-21)

## 13.30.0 (2024-03-06)

## 13.29.0 (2024-02-21)

## 13.28.0 (2024-02-09)

## 13.27.0 (2024-01-24)

## 13.26.0 (2024-01-10)

### New Features

-   Add the editor panels visibility state to the editor store in addition to the following actions and selectors: `toggleEditorPanelEnabled`, `toggleEditorPanelOpened`, `removeEditorPanel`, `isEditorPanelRemoved`, `isEditorPanelOpened` and `isEditorPanelEnabled`.

## 13.25.0 (2023-12-13)

## 13.24.0 (2023-11-29)

## 13.23.0 (2023-11-16)

## 13.22.0 (2023-11-02)

## 13.21.0 (2023-10-18)

## 13.20.0 (2023-10-05)

## 13.19.0 (2023-09-20)

## 13.18.0 (2023-08-31)

## 13.17.0 (2023-08-16)

## 13.16.0 (2023-08-10)

## 13.15.0 (2023-07-20)

## 13.14.0 (2023-07-05)

## 13.13.0 (2023-06-23)

## 13.12.0 (2023-06-07)

## 13.11.0 (2023-05-24)

## 13.10.0 (2023-05-10)

## 13.9.0 (2023-04-26)

## 13.8.0 (2023-04-12)

## 13.7.0 (2023-03-29)

## 13.6.0 (2023-03-15)

## 13.5.0 (2023-03-01)

## 13.4.0 (2023-02-15)

## 13.3.0 (2023-02-01)

## 13.2.0 (2023-01-11)

## 13.1.0 (2023-01-02)

## 13.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

## 12.21.0 (2022-11-16)

## 12.20.0 (2022-11-02)

## 12.19.0 (2022-10-19)

## 12.18.0 (2022-10-05)

## 12.17.0 (2022-09-21)

## 12.16.0 (2022-09-13)

### New Features

-   Add `isDeletingPost` selector to the `core/editor` store ([#44012](https://github.com/WordPress/gutenberg/pull/44012)).

## 12.15.0 (2022-08-24)

## 12.14.0 (2022-08-10)

## 12.13.0 (2022-07-27)

## 12.12.0 (2022-07-13)

## 12.11.0 (2022-06-29)

## 12.10.0 (2022-06-15)

## 12.9.0 (2022-06-01)

## 12.8.0 (2022-05-18)

## 12.7.0 (2022-05-04)

## 12.6.0 (2022-04-21)

## 12.5.0 (2022-04-08)

## 12.4.0 (2022-03-23)

## 12.3.0 (2022-03-11)

### Deprecations

-   Deprecated `cleanForSlug` that is now part of `@wordpress/url`.

## 12.2.0 (2022-02-10)

### Enhancements

-   Export `PostTaxonomiesFlatTermSelector` and `PostTaxonomiesHierarchicalTermSelector` components to allow using them to customize the default term selector for a taxonomy.

### Bug Fixes

-   Removed unused `@wordpress/autop`, `@wordpress/blob` and `@wordpress/is-shallow-equal` dependencies ([#38388](https://github.com/WordPress/gutenberg/pull/38388)).

### Deprecations

-   the `createUndoLevel` and `refreshPost` actions were marked as deprecated. They were already defunct and acting as noops.

## 12.1.0 (2022-01-27)

## 12.0.0 (2021-10-12)

### Breaking Changes

-   Removed the deprecated `resetAutosave` action ([#34537](https://github.com/WordPress/gutenberg/pull/34537)).
-   Removed the deprecated `getAutosave`, `hasAutosave` and `getBlockForSerialization` selectors ([#34537](https://github.com/WordPress/gutenberg/pull/34537)).

## 11.0.0 (2021-07-29)

### Breaking Changes

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 10.2.0 (2021-07-21)

## 10.1.0 (2021-05-20)

## 10.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at <https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/>.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at <https://nodejs.org/en/about/releases/>.

## 9.26.0 (2021-03-17)

## 9.25.0 (2020-12-17)

### New Features

-   Added a store definition `store` for the editor namespace to use with `@wordpress/data` API ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).

## 9.21.0 (2020-09-03)

### Enhancements

-   The `UnsavedChangesWarning` component is now using `__experimentalGetDirtyEntityRecords` to determine if there were changes.

## 9.4.0 (2019-06-12)

### Deprecations

-   The following components are deprecated as moved to the `@wordpress/block-editor` package:
    -   Autocomplete,
    -   AlignmentToolbar,
    -   BlockAlignmentToolbar,
    -   BlockControls,
    -   BlockEdit,
    -   BlockEditorKeyboardShortcuts,
    -   BlockFormatControls,
    -   BlockIcon,
    -   BlockInspector,
    -   BlockList,
    -   BlockMover,
    -   BlockNavigationDropdown,
    -   BlockSelectionClearer,
    -   BlockSettingsMenu,
    -   BlockTitle,
    -   BlockToolbar,
    -   ColorPalette,
    -   ContrastChecker,
    -   CopyHandler,
    -   createCustomColorsHOC,
    -   DefaultBlockAppender,
    -   FontSizePicker,
    -   getColorClassName,
    -   getColorObjectByAttributeValues,
    -   getColorObjectByColorValue,
    -   getFontSize,
    -   getFontSizeClass,
    -   Inserter,
    -   InnerBlocks,
    -   InspectorAdvancedControls,
    -   InspectorControls,
    -   PanelColorSettings,
    -   PlainText,
    -   RichText,
    -   RichTextShortcut,
    -   RichTextToolbarButton,
    -   RichTextInserterItem,
    -   MediaPlaceholder,
    -   MediaUpload,
    -   MediaUploadCheck,
    -   MultiBlocksSwitcher,
    -   MultiSelectScrollIntoView,
    -   NavigableToolbar,
    -   ObserveTyping,
    -   PreserveScrollInReorder,
    -   SkipToSelectedBlock,
    -   URLInput,
    -   URLInputButton,
    -   URLPopover,
    -   Warning,
    -   WritingFlow,
    -   withColorContext,
    -   withColors,
    -   withFontSizes.
-   The following actions are deprecated as moved to the `core/block-editor` store:
    -   resetBlocks,
    -   receiveBlocks,
    -   updateBlock,
    -   updateBlockAttributes,
    -   selectBlock,
    -   startMultiSelect,
    -   stopMultiSelect,
    -   multiSelect,
    -   clearSelectedBlock,
    -   toggleSelection,
    -   replaceBlocks,
    -   replaceBlock,
    -   moveBlocksDown,
    -   moveBlocksUp,
    -   moveBlockToPosition,
    -   insertBlock,
    -   insertBlocks,
    -   showInsertionPoint,
    -   hideInsertionPoint,
    -   setTemplateValidity,
    -   synchronizeTemplate,
    -   mergeBlocks,
    -   removeBlocks,
    -   removeBlock,
    -   toggleBlockMode,
    -   startTyping,
    -   stopTyping,
    -   enterFormattedText,
    -   exitFormattedText,
    -   insertDefaultBlock,
    -   updateBlockListSettings.
-   The following selectors are deprecated as moved to the `core/block-editor` store:
    -   getBlockDependantsCacheBust,
    -   getBlockName,
    -   isBlockValid,
    -   getBlockAttributes,
    -   getBlock,
    -   getBlocks,
    -   getClientIdsOfDescendants,
    -   getClientIdsWithDescendants,
    -   getGlobalBlockCount,
    -   getBlocksByClientId,
    -   getBlockCount,
    -   getBlockSelectionStart,
    -   getBlockSelectionEnd,
    -   getSelectedBlockCount,
    -   hasSelectedBlock,
    -   getSelectedBlockClientId,
    -   getSelectedBlock,
    -   getBlockRootClientId,
    -   getBlockHierarchyRootClientId,
    -   getAdjacentBlockClientId,
    -   getPreviousBlockClientId,
    -   getNextBlockClientId,
    -   getSelectedBlocksInitialCaretPosition,
    -   getMultiSelectedBlockClientIds,
    -   getMultiSelectedBlocks,
    -   getFirstMultiSelectedBlockClientId,
    -   getLastMultiSelectedBlockClientId,
    -   isFirstMultiSelectedBlock,
    -   isBlockMultiSelected,
    -   isAncestorMultiSelected,
    -   getMultiSelectedBlocksStartClientId,
    -   getMultiSelectedBlocksEndClientId,
    -   getBlockOrder,
    -   getBlockIndex,
    -   isBlockSelected,
    -   hasSelectedInnerBlock,
    -   isBlockWithinSelection,
    -   hasMultiSelection,
    -   isMultiSelecting,
    -   isSelectionEnabled,
    -   getBlockMode =,
    -   isTyping,
    -   isCaretWithinFormattedText,
    -   getBlockInsertionPoint,
    -   isBlockInsertionPointVisible,
    -   isValidTemplate,
    -   getTemplate,
    -   getTemplateLock,
    -   canInsertBlockType,
    -   getInserterItems,
    -   hasInserterItems,
    -   getBlockListSettings.

## 9.3.0 (2019-05-21)

### Deprecations

-   The `getAutosave`, `getAutosaveAttribute`, and `hasAutosave` selectors are deprecated. Please use the `getAutosave` selector in the `@wordpress/core-data` package.
-   The `resetAutosave` action is deprecated. An equivalent action `receiveAutosaves` has been added to the `@wordpress/core-data` package.
-   `ServerSideRender` component was deprecated. The component is now available in `@wordpress/server-side-render`.

### Internal

-   Refactor setupEditor effects to action-generator using controls ([#14513](https://github.com/WordPress/gutenberg/pull/14513))
-   Remove redux-multi dependency (no longer needed/used with above refactor)
-   Replace internal controls definitions with usage of new @wordpress/data-controls package (see [#15435](https://github.com/WordPress/gutenberg/pull/15435)

## 9.1.0 (2019-03-06)

### New Features

-   Added `createCustomColorsHOC` for creating a higher order `withCustomColors` component.
-   Added a new `TextEditorGlobalKeyboardShortcuts` component.

### Deprecations

-   `EditorGlobalKeyboardShortcuts` has been deprecated in favor of `VisualEditorGlobalKeyboardShortcuts`.

### Bug Fixes

-   BlockSwitcher will now consistently render an icon for block multi-selections.

### Internal

-   Removed `jQuery` dependency.
-   Removed `TinyMCE` dependency.
-   RichText: improve format boundaries.
-   Refactor all post effects to action-generators using controls ([#13716](https://github.com/WordPress/gutenberg/pull/13716))

## 9.0.7 (2019-01-03)

## 9.0.6 (2018-12-18)

### Bug Fixes

-   Restore the `block` prop in the `BlockListBlock` filter.

## 9.0.5 (2018-12-12)

### Bug Fixes

-   `getEditedPostAttribute` now correctly returns the merged result of edits as a partial change when given `'meta'` as the `attributeName`.
-   Fixes an error and unrecoverable state which occurs on autosave completion for a `'publicly_queryable' => false` post type.

## 9.0.4 (2018-11-30)

## 9.0.3 (2018-11-30)

## 9.0.2 (2018-11-22)

## 9.0.1 (2018-11-21)

## 9.0.0 (2018-11-20)

### Breaking Changes

-   `PostPublishPanelToggle` has been removed. Use `PostPublishButton` instead.

## 8.0.0 (2018-11-15)

### Breaking Changes

-   The reusable blocks actions and selectors have been marked as experimental.

### Bug Fixes

-   Stop propagating to DOM elements the `focusOnMount` prop from `NavigableToolbar` components

## 7.0.1 (2018-11-12)

### Internal

-   Remove unnecessary `locale` prop usage [#11649](https://github.com/WordPress/gutenberg/pull/11649)

### Bug Fixes

-   Fix multi-selection triggering too often when using floated blocks.

## 7.0.0 (2018-11-12)

### Breaking Changes

-   The `PanelColor` component has been removed.

### New Features

-   In `NavigableToolbar`, a property focusOnMount was added, if true, the toolbar will get focus as soon as it mounted. Defaults to false.

### Bug Fixes

-   Avoid unnecessary re-renders when navigating between blocks.
-   PostPublishPanel: return focus to element that opened the panel
-   Capture focus on self in InsertionPoint inserter
-   Correct insertion point opacity selector
-   Set code editor as RTL

## 6.2.1 (2018-11-09)

### Deprecations

-   `PostPublishPanelToggle` has been deprecated in favor of `PostPublishButton`.

### Internal

-   Reactive block styles.

## 6.2.0 (2018-11-09)

### New Features

-   Adjust a11y roles for menu items, and make sure screen readers can properly use BlockNavigationList ([#11431](https://github.com/WordPress/gutenberg/issues/11431)).

## 6.1.1 (2018-11-03)

### Internal

-   Remove `findDOMNode` usage from the `Inserter` component.
-   Remove `findDOMNode` usage from the `Block` component.
-   Remove `findDOMNode` usage from the `NavigableToolbar` component.

## 6.1.0 (2018-10-30)

### Deprecations

-   The Reusable blocks Data API is marked as experimental as it's subject to change in the future ([#11230](https://github.com/WordPress/gutenberg/pull/11230)).

## 6.0.1 (2018-10-30)

### Bug Fixes

-   Tweak the vanilla style sheet for consistency.
-   Fix the "Copy Post Text" button not copying the post text.

## 6.0.0 (2018-10-29)

### Breaking Changes

-   The `labels.name` property has been removed from `MediaPlaceholder` in favor of the new `labels.instructions` prop.
-   The `UnsavedChangesWarning` component no longer accepts a `forceIsDirty` prop.
-   `mediaDetails` in object passed to `onFileChange` callback of `mediaUpload`. Please use `media_details` property instead.

### New Features

-   In `MediaPlaceholder`, provide default values for title and instructions labels when allowed type is one of image, audio or video.
-   New actions `lockPostSaving` and `unlockPostSaving` were introduced ([#10649](https://github.com/WordPress/gutenberg/pull/10649)).
-   New selector `isPostSavingLocked` was introduced ([#10649](https://github.com/WordPress/gutenberg/pull/10649)).

### Internal

-   Add animated logo to preview interstitial screen.
-   Tweak the editor styles support.

### Bug Fixes

-   Made preview interstitial text translatable.

## 5.0.1 (2018-10-22)

## 5.0.0 (2018-10-19)

### Breaking Changes

-   The `checkTemplateValidity` action has been removed. Validity is verified automatically upon block reset.

### Deprecations

-   `PanelColor` has been deprecated in favor of `PanelColorSettings`.

### New Features

-   Added `onClose` prop to `URLPopover` component.

## 4.0.3 (2018-10-18)

## 4.0.0 (2018-09-30)

### Breaking Changes

-   `getColorName` has been removed. Use `getColorObjectByColorValue` instead.
-   `getColorClass` has been renamed. Use `getColorClassName` instead.
-   The `value` property in color objects passed by `withColors` has been removed. Use `color` property instead.
-   `RichText` `getSettings` prop has been removed. The `unstableGetSettings` prop is available if continued use is required. Unstable APIs are strongly discouraged to be used, and are subject to removal without notice, even as part of a minor release.
-   `RichText` `onSetup` prop has been removed. The `unstableOnSetup` prop is available if continued use is required. Unstable APIs are strongly discouraged to be used, and are subject to removal without notice, even as part of a minor release.
-   `RichTextProvider` has been removed. Please use `wp.data.select( 'core/editor' )` methods instead.

### Deprecations

-   The `checkTemplateValidity` action has been deprecated. Validity is verified automatically upon block reset.
-   The `UnsavedChangesWarning` component `forceIsDirty` prop has been deprecated.

## 3.0.0 (2018-09-05)

### New Features

-   Add editor styles support.

### Breaking Changes

-   The `wideAlign` block supports hook has been removed. Use `alignWide` instead.
-   `fetchSharedBlocks` action has been removed. Use `fetchReusableBlocks` instead.
-   `receiveSharedBlocks` action has been removed. Use `receiveReusableBlocks` instead.
-   `saveSharedBlock` action has been removed. Use `saveReusableBlock` instead.
-   `deleteSharedBlock` action has been removed. Use `deleteReusableBlock` instead.
-   `updateSharedBlockTitle` action has been removed. Use `updateReusableBlockTitle` instead.
-   `convertBlockToSaved` action has been removed. Use `convertBlockToReusable` instead.
-   `getSharedBlock` selector has been removed. Use `getReusableBlock` instead.
-   `isSavingSharedBlock` selector has been removed. Use `isSavingReusableBlock` instead.
-   `isFetchingSharedBlock` selector has been removed. Use `isFetchingReusableBlock` instead.
-   `getSharedBlocks` selector has been removed. Use `getReusableBlocks` instead.
-   `editorMediaUpload` has been removed. Use `mediaUpload` instead.
-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
-   `DocumentTitle` component has been removed.
-   `getDocumentTitle` selector (`core/editor`) has been removed.

### Deprecations

-   `RichTextProvider` flagged for deprecation. Please use `wp.data.select( 'core/editor' )` methods instead.

### Bug Fixes

-   The `PostTextEditor` component will respect its in-progress state edited value, even if the assigned prop value changes.
