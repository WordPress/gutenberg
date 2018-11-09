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
