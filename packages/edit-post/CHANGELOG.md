## Master

### New Features

- Implement the `addToGallery` option in the `MediaUpload` hook. The option allows users to open the media modal in the `gallery-library`instead of `gallery-edit` state.

### Refactor

- convert `INIT` effect to controls & actions [#14740](https://github.com/WordPress/gutenberg/pull/14740)


## 3.2.0 (2019-03-06)

### Polish

* Expose the `className` property to style the `PluginSidebar` component.

### Bug Fixes

- Fix 'save' keyboard shortcut not functioning in the Code Editor.
- Prevent `ClipboardButton` from incorrectly copying a serialized block string instead of the intended text in Safari.

## 3.1.7 (2019-01-03)

## 3.1.6 (2018-12-18)

## 3.1.5 (2018-12-12)

### Bug Fixes
 - Fix saving WYSIWYG Meta Boxes

## 3.1.4 (2018-11-30)

## 3.1.3 (2018-11-30)

## 3.1.2 (2018-11-22)

## 3.1.1 (2018-11-21)

## 3.1.0 (2018-11-20)

### New Feature

- The new `AdminNotices` component will transparently upgrade any `.notice` elements on the page to the equivalent `@wordpress/notices` module notice state.

## 3.0.2 (2018-11-15)

## 3.0.1 (2018-11-12)

## 3.0.0 (2018-11-12)

### Breaking Change

- `isEditorSidebarPanelOpened` selector (`core/edit-post`) has been removed. Please use `isEditorPanelEnabled` instead.
- `toggleGeneralSidebarEditorPanel` action (`core/edit-post`) has been removed. Please use `toggleEditorPanelOpened` instead.

## 2.1.1 (2018-11-09)

## 2.1.0 (2018-11-09)

### Bug Fixes

- "View as" link is not updated after the post is updated and the permalink is changed.
- Hide custom fields option when the meta box is disabled.

## 2.0.3 (2018-11-03)

## 2.0.2 (2018-10-30)

## 2.0.1 (2018-10-30)

## 2.0.0 (2018-10-29)

### Breaking Changes

- `setActiveMetaBoxLocations` action (`core/edit-post`) has been removed.
- `initializeMetaBoxState` action (`core/edit-post`) has been removed.
- `initializeEditor` no longer returns an object. Use the `setActiveMetaBoxLocations` action (`core/edit-post`) in place of the existing object's `initializeMetaBoxes` function.
- `setMetaBoxSavedData` action (`core/edit-post`) has been removed.
- `getMetaBoxes` selector (`core/edit-post`) has been removed. Use `getActiveMetaBoxLocations` selector (`core/edit-post`) instead.
- `getMetaBox` selector (`core/edit-post`) has been removed. Use `isMetaBoxLocationActive` selector (`core/edit-post`) instead.

### Polish

- Add the editor styles support's wrapper className.

### Bug Fixes

- Hide pinned plugins and block traversal tool from header on mobile.

## 1.0.4 (2018-10-22)

### Bug Fixes

- Fix fullscreen mode toggle.

## 1.0.3 (2018-10-19)

## 1.0.2 (2018-10-18)

## 1.0.0 (2018-10-10)

### New Features

- Initial release.
