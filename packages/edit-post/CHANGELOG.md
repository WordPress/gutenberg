<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 8.6.0 (2024-08-21)

## 8.5.0 (2024-08-07)

## 8.4.0 (2024-07-24)

## 8.3.0 (2024-07-10)

## 8.2.0 (2024-06-26)

## 8.1.0 (2024-06-15)

### Bug Fixes

-   Add ´@wordpress/html-entities´ package to the list of dependencies in package.json. ([#62313](https://github.com/WordPress/gutenberg/pull/62313))

## 8.0.0 (2024-05-31)

### Breaking Changes

-   Variables like `process.env.IS_GUTENBERG_PLUGIN` have been replaced by `globalThis.IS_GUTENBERG_PLUGIN`. Build systems using `process.env` should be updated ([#61486](https://github.com/WordPress/gutenberg/pull/61486)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 7.35.0 (2024-05-16)

### Internal

-   Replaced `classnames` package with the faster and smaller `clsx` package ([#61138](https://github.com/WordPress/gutenberg/pull/61138)).

## 7.34.0 (2024-05-02)

## 7.33.0 (2024-04-19)

## 7.32.0 (2024-04-03)

## 7.31.0 (2024-03-21)

## 7.30.0 (2024-03-06)

## 7.29.0 (2024-02-21)

## 7.28.0 (2024-02-09)

## 7.27.0 (2024-01-24)

## 7.26.0 (2024-01-10)

### Deprecations

-   Move the panels visibility actions and selectors to the editor package deprecating `toggleEditorPanelEnabled`, `toggleEditorPanelOpened`, `removeEditorPanel`, `isEditorPanelRemoved`, `isEditorPanelOpened` and `isEditorPanelEnabled`.

## 7.25.0 (2023-12-13)

## 7.24.0 (2023-11-29)

## 7.23.0 (2023-11-16)

## 7.22.0 (2023-11-02)

## 7.21.0 (2023-10-18)

## 7.20.0 (2023-10-05)

## 7.19.0 (2023-09-20)

## 7.18.0 (2023-08-31)

## 7.17.0 (2023-08-16)

## 7.16.0 (2023-08-10)

## 7.15.0 (2023-07-20)

## 7.14.0 (2023-07-05)

## 7.13.0 (2023-06-23)

## 7.12.0 (2023-06-07)

## 7.11.0 (2023-05-24)

## 7.10.0 (2023-05-10)

## 7.9.0 (2023-04-26)

## 7.8.0 (2023-04-12)

## 7.7.0 (2023-03-29)

## 7.6.0 (2023-03-15)

## 7.5.0 (2023-03-01)

## 7.4.0 (2023-02-15)

## 7.3.0 (2023-02-01)

## 7.2.0 (2023-01-11)

## 7.1.0 (2023-01-02)

## 7.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

## 6.19.0 (2022-11-16)

### Enhancements

-   ` BlockTypesChecklist`: Move BlockIcon component out of CheckboxControl label ([#45535](https://github.com/WordPress/gutenberg/pull/45535))

## 6.18.0 (2022-11-02)

## 6.17.0 (2022-10-19)

## 6.16.0 (2022-10-05)

## 6.15.0 (2022-09-21)

## 6.14.0 (2022-09-13)

## 6.13.0 (2022-08-24)

## 6.12.0 (2022-08-10)

## 6.11.0 (2022-07-27)

## 6.10.0 (2022-07-13)

## 6.9.0 (2022-06-29)

## 6.8.0 (2022-06-15)

## 6.7.0 (2022-06-01)

## 6.6.0 (2022-05-18)

## 6.5.0 (2022-05-04)

## 6.4.0 (2022-04-21)

## 6.3.0 (2022-04-08)

## 6.2.0 (2022-03-23)

## 6.1.0 (2022-03-11)

## 6.0.0 (2022-02-10)

### Breaking Changes

-   The `GUTENBERG_PHASE` environment variable has been renamed to `IS_GUTENBERG_PLUGIN` and is now a boolean ([#38202](https://github.com/WordPress/gutenberg/pull/38202)).

### Bug Fixes

-   Removed unused `@wordpress/api-fetch`, `@wordpress/primitives` and `uuid` dependencies ([#38388](https://github.com/WordPress/gutenberg/pull/38388)).

## 5.1.0 (2022-01-27)

## 5.0.0 (2021-07-29)

### Breaking Changes

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 4.2.0 (2021-07-21)

## 4.1.0 (2021-05-20)

## 4.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at <https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/>.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at <https://nodejs.org/en/about/releases/>.

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

### Internal

-   Create EditorInitializer component and implement for various things to initialize as the editor is loaded. This replaces the `__unstableInitialize` refactor done in #14740. ([#15444](https://github.com/WordPress/gutenberg/pull/15444))

## 3.4.0 (2019-05-21)

### New Features

-   Implement the `addToGallery` option in the `MediaUpload` hook. The option allows users to open the media modal in the `gallery-library`instead of `gallery-edit` state.

### Internal

-   convert `INIT` effect to controls & actions [#14740](https://github.com/WordPress/gutenberg/pull/14740)

## 3.2.0 (2019-03-06)

### Internal

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

### New Features

-   The new `AdminNotices` component will transparently upgrade any `.notice` elements on the page to the equivalent `@wordpress/notices` module notice state.

## 3.0.2 (2018-11-15)

## 3.0.1 (2018-11-12)

## 3.0.0 (2018-11-12)

### Breaking Changes

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

### Internal

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
