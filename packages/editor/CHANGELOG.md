<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Add a private `SiteExport` menu item, moved from `edit-site`. It offers downloading the theme with the user's changes, only while editing a template or a template part — the entities the exported theme is made of ([#81992](https://github.com/WordPress/gutenberg/pull/81992)).

### Enhancements

-   Commands: Add a command palette entry that opens the current post on the front end once it is published, labelled with the post type's `view_item` label ([#66720](https://github.com/WordPress/gutenberg/pull/66720)).
-   Pre-publish panel: Remove the "Visibility" and "Publish" headings that repeated the title of the panel containing them. The publish date's reset action, which lived in the removed header, becomes a "Reset" button below the date picker, disabled but still focusable while the post is set to publish immediately ([#81806](https://github.com/WordPress/gutenberg/pull/81806)).

### Bug Fixes

-   Register the editor and block editor keyboard shortcuts from the editor provider, so shortcuts work for consumers that mount the editor without rendering `EditorKeyboardShortcutsRegister` themselves ([#81580](https://github.com/WordPress/gutenberg/pull/81580)).
-   Header: Allow the Back button column to grow when "Show button text labels" is enabled so the label is not obscured by the following controls ([#81701](https://github.com/WordPress/gutenberg/pull/81701)).
-   Notes: Stop forcing capitalization of the user name in a note byline, so the name is shown as the user set it ([#81788](https://github.com/WordPress/gutenberg/pull/81788)).
-   Device Preview: Center the editor canvas with the canvas container's own flex alignment rather than the canvas's auto margins, which were conditional on the resize handles being active. Switching from the mobile or tablet preview back to desktop no longer expands the canvas from the left edge ([#81484](https://github.com/WordPress/gutenberg/pull/81484)).
-   `PostSchedule`: Announce the new publish date to screen readers when the date is changed ([#81629](https://github.com/WordPress/gutenberg/pull/81629)).
-   Start page/template pattern modals: Align the footer actions with the modal content's padding, so the footer no longer overflows the modal width ([#82021](https://github.com/WordPress/gutenberg/pull/82021)).

### Internal

-   Check the `window.__experimentalEnableRealTimeCollaboration` flag set by the Real-Time Collaboration experiment, instead of `window._wpCollaborationEnabled`, when determining whether collaboration is enabled for the current post ([#80658](https://github.com/WordPress/gutenberg/pull/80658)).
-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81515](https://github.com/WordPress/gutenberg/pull/81515))

### Enhancements

-   Add an `initialViewport` prop to the editor provider, setting the width each entity opens at from the breakpoints the theme defines, so a host no longer has to dispatch `setDeviceType` from outside the provider and race the settings it reads ([#81750](https://github.com/WordPress/gutenberg/pull/81750)).

## 14.53.0 (2026-08-12)

### Internal

-   Notes: Move the rich text control the note form renders from `@wordpress/dataviews` into this package, where `@wordpress/rich-text` is the same copy the block editor uses ([#81430](https://github.com/WordPress/gutenberg/pull/81430)).
-   Use the new `@wordpress/kebab-case` package instead of unlocking the `kebabCase` utility from the `@wordpress/components` private APIs ([#81294](https://github.com/WordPress/gutenberg/pull/81294)).
-   Vendor a local copy of the `normalizeTextString` utility instead of unlocking it from the `@wordpress/components` private APIs ([#81294](https://github.com/WordPress/gutenberg/pull/81294)).

### Enhancements

-   Add a read-only code diff to the revisions screen ([#80314](https://github.com/WordPress/gutenberg/pull/80314)).

### New Features

-   Add a `blockStatesEditingEnabled` editor setting, defaulting to `true`, which hides state controls for blocks in the block inspector and Global Styles when set to `false` ([#80956](https://github.com/WordPress/gutenberg/pull/80956), [#81058](https://github.com/WordPress/gutenberg/pull/81058)).

### Bug Fixes

-   Device Preview: Keep tablet and mobile iframe widths inside their responsive breakpoints so media queries remain accurate at browser zoom levels.
-   Document tools: Fix icon button focus styles to use the design system `outset-ring__focus` mixin ([#81115](https://github.com/WordPress/gutenberg/pull/81115)).

## 14.52.0 (2026-07-29)

### Enhancements

-   Notes: Remove "Add note" from the rich-text formatting toolbar's "More" (inline styles) dropdown. Adding a note is not an inline style, the item duplicated the block options entry, and the dropdown's chevron rendered as pressed whenever the caret sat inside a note ([#80531](https://github.com/WordPress/gutenberg/pull/80531)).

### New Features

-   The "Apply globally" control now opens a review modal so you can choose which of a block's modified styles are pushed to Global Styles, showing each style's current and new value ([#79839](https://github.com/WordPress/gutenberg/pull/79839)).
-   Add a `responsiveEditingEnabled` editor setting, defaulting to `true`, which hides the "Responsive styles" option in the View menu and the viewport state control in Global Styles when set to `false` ([#80814](https://github.com/WordPress/gutenberg/pull/80814)).

### Bug Fixes

-   `mediaUpload`: Add an `isTransportOnly` parameter, set by the `@wordpress/upload-media` queue, which owns progress tracking and save locking for its own items and uses this function only as its server transport. Fixes the progress snackbar showing "1 of 2" for a single HEIC upload in Safari ([#80369](https://github.com/WordPress/gutenberg/issues/80369)).

### Internal

-   Update `date-fns` to 4.4.0 ([#80763](https://github.com/WordPress/gutenberg/pull/80763)).

## 14.51.0 (2026-07-14)

### New Features

-   Add an "Attachments" source to the block inserter's Media tab, listing images attached to the current post with the ability to attach and detach them ([#79336](https://github.com/WordPress/gutenberg/pull/79336)).

### Enhancements

-   Use the emphasis font-weight token for UI emphasis ([#80093](https://github.com/WordPress/gutenberg/pull/80093)).
-   Notes: Remove the snackbar notice shown when a note is resolved or reopened, as the note's appearance already updates in place to reflect the change. The result is still announced to screen readers ([#80017](https://github.com/WordPress/gutenberg/pull/80017)).
-   The "View the autosave" notice now opens the autosave in the visual revisions view with its changes highlighted, instead of the classic revisions screen. It falls back to the classic screen when visual revisions are disabled ([#79947](https://github.com/WordPress/gutenberg/pull/79947)).

### Bug Fixes

-   Render the "Preview in new tab" action with the shared menu item pattern so its typography matches sibling menu items ([#80195](https://github.com/WordPress/gutenberg/pull/80195)).
-   External images are now sideloaded on the server when uploaded to the media library, via a new `mediaSideloadFromUrl` block editor setting, so the upload works when the editor is cross-origin isolated (e.g. with client-side media processing enabled) ([#79409](https://github.com/WordPress/gutenberg/pull/79409)).

### Enhancements

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

## 14.50.0 (2026-07-01)

## 14.49.0 (2026-06-24)

## 14.48.1 (2026-06-16)

## 14.48.0 (2026-06-10)

### New Features

-   Added `UploadProgressSnackbar` component that shows a persistent snackbar with upload progress while media uploads are in progress. The snackbar shows a spinner during uploads and a checkmark briefly when all uploads complete.

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).

### Documentation

-   Fix documentation grammar ([#78686](https://github.com/WordPress/gutenberg/pull/78686)).

### Internal

-   Dependency updates ([#77954](https://github.com/WordPress/gutenberg/pull/77954)).

## 14.47.0 (2026-05-27)

### Enhancements

-   Editor: Add padding around inline notices in the editor content area and distraction-free header.
-   Editor: Pause the client-side media upload queue while the browser is offline and resume it automatically when connectivity returns ([#76765](https://github.com/WordPress/gutenberg/pull/76765)).
-   The Media Editor modal is now mounted unconditionally and the `openMediaEditorModal` setting is always provided to the block editor. Previously both were gated behind the `gutenberg-media-editor-modal` experiment, which has been removed.

### Bug Fixes

-   `mediaFinalize` now returns the post-finalize attachment (transformed from the REST response), so the upload-media queue can refresh the in-flight attachment URL. Required for the front-end `srcset` to render on client-side-media uploads that exceeded the big-image threshold.
-   Template actions panel: Fix the keyboard activation of the "Change template" preview so it only opens the swap modal on <kbd>Enter</kbd> / <kbd>Space</kbd> ([#78641](https://github.com/WordPress/gutenberg/pull/78641)).

### Internal

-   Updated `diff` dependency from `^4.0.2` to `^8.0.3` ([#77992](https://github.com/WordPress/gutenberg/pull/77992)).

## 14.46.0 (2026-05-14)

### Internal

-   Update `date-fns` dependency to `v4.1.0` ([#78057](https://github.com/WordPress/gutenberg/pull/78057)).

## 14.45.0 (2026-04-29)

## 14.44.0 (2026-04-15)

## 14.43.0 (2026-04-01)

## 14.42.0 (2026-03-18)

### Bug Fixes

-   Fixed avatar contrast ring not displaying over loaded images by using a `::after` pseudo-element instead of an inset `box-shadow`.

## 14.41.0 (2026-03-04)

## 14.40.0 (2026-02-18)

## 14.39.0 (2026-01-29)

## 14.38.0 (2026-01-16)

## 14.36.0 (2025-11-26)

### Internal

-   Applied the `welcome-guide` close-button hover color locally to maintain consistent styling after changes to the shared `Guide` component.

## 14.35.0 (2025-11-12)

## 14.34.0 (2025-10-29)

## 14.33.0 (2025-10-17)

## 14.32.0 (2025-10-01)

## 14.31.0 (2025-09-17)

## 14.30.0 (2025-09-03)

## 14.29.0 (2025-08-20)

## 14.28.0 (2025-08-07)

## 14.27.0 (2025-07-23)

## 14.26.0 (2025-06-25)

## 14.25.0 (2025-06-04)

## 14.24.0 (2025-05-22)

## 14.23.0 (2025-05-07)

## 14.22.0 (2025-04-11)

## 14.21.0 (2025-03-27)

## 14.20.0 (2025-03-13)

## 14.19.0 (2025-02-28)

## 14.18.0 (2025-02-12)

## 14.17.0 (2025-01-29)

## 14.16.0 (2025-01-15)

## 14.15.0 (2025-01-02)

## 14.14.0 (2024-12-11)

## 14.13.0 (2024-11-27)

## 14.12.0 (2024-11-16)

## 14.11.0 (2024-10-30)

### Bug Fixes

-   `Post Featured Image`: Fix `Set featured image` button's `box-shadow` transition to prevent border from flashing when focused.

## 14.10.0 (2024-10-16)

## 14.9.0 (2024-10-03)

## 14.8.0 (2024-09-19)

## 14.7.0 (2024-09-05)

## 14.6.0 (2024-08-21)

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
