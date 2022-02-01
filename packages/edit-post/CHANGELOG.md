<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Breaking Change

-   The `GUTENBERG_PHASE` environment variable has been renamed to `IS_GUTENBERG_PLUGIN` and is now a boolean ([#38202](https://github.com/WordPress/gutenberg/pull/38202)).

## 5.1.0 (2022-01-27)

## 5.0.0 (2021-07-29)

### Breaking Change

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 4.2.0 (2021-07-21)

## 4.1.0 (2021-05-20)

## 4.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 3.27.0 (2021-03-17)

### New Features

-   When the plugin renders a pinnable `PluginSidebar` component, then by default it also automatically renders a corresponding `PluginSidebarMenuItem`. It's respecting matching `PluginSidebarMenuItem` components registered by plugins and therefore is fully backward compatible ([#29081](https://github.com/WordPress/gutenberg/pull/29081)).

## 3.13.0 (2020-02-10)

### Internal

-   Move the internal `EditorRegions` component to the `@wordpress/block-editor` package, an rename to `EditorSkeleton`. Its class names have thus been renamed from `edit-post-editor-regions` to `block-editor-editor-skeleton`.

## 3.8.2

### Bug Fixes

-   Fix regression introduced by EditorInitializer component which auto-closed sidebar plugins when opened on small screens. ([#17712](https://github.com/WordPress/gutenberg/pull/17712))

## 3.6.0 (2019-08-05)

### Refactor

-   Create EditorInitializer component and implement for various things to initialize as the editor is loaded. This replaces the `__unstableInitialize` refactor done in #14740. ([#15444](https://github.com/WordPress/gutenberg/pull/15444))

## 3.4.0 (2019-05-21)

### New Feature

-   Implement the `addToGallery` option in the `MediaUpload` hook. The option allows users to open the media modal in the `gallery-library`instead of `gallery-edit` state.

### Refactor

-   convert `INIT` effect to controls & actions [#14740](https://github.com/WordPress/gutenberg/pull/14740)

## 3.2.0 (2019-03-06)

### Polish

-   Expose the `className` property to style the `PluginSidebar` component.

### Bug Fixes

-   Fix 'save' keyboard shortcut not functioning in the Code Editor.
-   Prevent `ClipboardButton` from incorrectly copying a serialized block string instead of the intended text in Safari.

## 3.1.7 (2019-01-03)

## 3.1.6 (2018-12-18)

## 3.1.5 (2018-12-12)

### Bug Fixes

-   Fix saving WYSIWYG Meta Boxes

## 3.1.4 (2018-11-30)

## 3.1.3 (2018-11-30)

## 3.1.2 (2018-11-22)

## 3.1.1 (2018-11-21)

## 3.1.0 (2018-11-20)

### New Feature

-   The new `AdminNotices` component will transparently upgrade any `.notice` elements on the page to the equivalent `@wordpress/notices` module notice state.

## 3.0.2 (2018-11-15)

## 3.0.1 (2018-11-12)

## 3.0.0 (2018-11-12)

### Breaking Change

-   `isEditorSidebarPanelOpened` selector (`core/edit-post`) has been removed. Please use `isEditorPanelEnabled` instead.
-   `toggleGeneralSidebarEditorPanel` action (`core/edit-post`) has been removed. Please use `toggleEditorPanelOpened` instead.

## 2.1.1 (2018-11-09)

## 2.1.0 (2018-11-09)

### Bug Fixes

-   "View as" link is not updated after the post is updated and the permalink is changed.
-   Hide custom fields option when the meta box is disabled.

## 2.0.3 (2018-11-03)

## 2.0.2 (2018-10-30)

## 2.0.1 (2018-10-30)

## 2.0.0 (2018-10-29)

### Breaking Changes

-   `setActiveMetaBoxLocations` action (`core/edit-post`) has been removed.
-   `initializeMetaBoxState` action (`core/edit-post`) has been removed.
-   `initializeEditor` no longer returns an object. Use the `setActiveMetaBoxLocations` action (`core/edit-post`) in place of the existing object's `initializeMetaBoxes` function.
-   `setMetaBoxSavedData` action (`core/edit-post`) has been removed.
-   `getMetaBoxes` selector (`core/edit-post`) has been removed. Use `getActiveMetaBoxLocations` selector (`core/edit-post`) instead.
-   `getMetaBox` selector (`core/edit-post`) has been removed. Use `isMetaBoxLocationActive` selector (`core/edit-post`) instead.

### Polish

-   Add the editor styles support's wrapper className.

### Bug Fixes

-   Hide pinned plugins and block traversal tool from header on mobile.

## 1.0.4 (2018-10-22)

### Bug Fixes

-   Fix fullscreen mode toggle.

## 1.0.3 (2018-10-19)

## 1.0.2 (2018-10-18)

## 1.0.0 (2018-10-10)

### New Features

-   Initial release.
