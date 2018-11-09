## 7.0.0 (Unreleased)

### Breaking Changes

- The `PanelColor` component has been removed.

## 6.2.1 (2018-11-09)

### New Features

- In `NavigableToolbar`, a property focusOnMount was added, if true, the toolbar will get focus as soon as it mounted. Defaults to false.

### Polish

- Reactive block styles.

## 6.2.0 (2018-11-09)

### New Features

- Adjust a11y roles for menu items, and make sure screen readers can properly use BlockNavigationList ([#11431](https://github.com/WordPress/gutenberg/issues/11431)).

## 6.1.1 (2018-11-03)

### Polish

- Remove `findDOMNode` usage from the `Inserter` component.
- Remove `findDOMNode` usage from the `Block` component.
- Remove `findDOMNode` usage from the `NavigableToolbar` component.

## 6.1.0 (2018-10-30)

### Deprecations

- The Reusable Blocks Data API is marked as experimental as it's subject to change in the future ([#11230](https://github.com/WordPress/gutenberg/pull/11230)).

## 6.0.1 (2018-10-30)

### Bug Fixes

- Tweak the vanilla style sheet for consistency.
- Fix the "Copy Post Text" button not copying the post text.

## 6.0.0 (2018-10-29)

### Breaking Changes

- The `labels.name` property has been removed from `MediaPlaceholder` in favor of the new `labels.instructions` prop.
- The `UnsavedChangesWarning` component no longer accepts a `forceIsDirty` prop.
- `mediaDetails` in object passed to `onFileChange` callback of `mediaUpload`. Please use `media_details` property instead.

### New Features

- In `MediaPlaceholder`, provide default values for title and instructions labels when allowed type is one of image, audio or video.
- New actions `lockPostSaving` and `unlockPostSaving` were introduced ([#10649](https://github.com/WordPress/gutenberg/pull/10649)).
- New selector `isPostSavingLocked` was introduced ([#10649](https://github.com/WordPress/gutenberg/pull/10649)).

### Polish

- Add animated logo to preview interstitial screen.
- Tweak the editor styles support.

### Bug Fixes

- Made preview interstitial text translatable.

## 5.0.1 (2018-10-22)

## 5.0.0 (2018-10-19)

### Breaking Changes

- The `checkTemplateValidity` action has been removed. Validity is verified automatically upon block reset.

### Deprecations

- `wp.editor.PanelColor` has been deprecated in favor of `wp.editor.PanelColorSettings`.

### New Features

- Added `onClose` prop to `URLPopover` component.

## 4.0.3 (2018-10-18)

## 4.0.0 (2018-09-30)

### Breaking Changes

- `getColorName` has been removed. Use `getColorObjectByColorValue` instead.
- `getColorClass` has been renamed. Use `getColorClassName` instead.
- The `value` property in color objects passed by `withColors` has been removed. Use `color` property instead.
- `RichText` `getSettings` prop has been removed. The `unstableGetSettings` prop is available if continued use is required. Unstable APIs are strongly discouraged to be used, and are subject to removal without notice, even as part of a minor release.
- `RichText` `onSetup` prop has been removed. The `unstableOnSetup` prop is available if continued use is required. Unstable APIs are strongly discouraged to be used, and are subject to removal without notice, even as part of a minor release.
- `wp.editor.RichTextProvider` has been removed. Please use `wp.data.select( 'core/editor' )` methods instead.

### Deprecations

- The `checkTemplateValidity` action has been deprecated. Validity is verified automatically upon block reset.
- The `UnsavedChangesWarning` component `forceIsDirty` prop has been deprecated.

## 3.0.0 (2018-09-05)

### New Features

- Add editor styles support.

### Breaking Changes

- The `wideAlign` block supports hook has been removed. Use `alignWide` instead.
- `fetchSharedBlocks` action has been removed. Use `fetchReusableBlocks` instead.
- `receiveSharedBlocks` action has been removed. Use `receiveReusableBlocks` instead.
- `saveSharedBlock` action has been removed. Use `saveReusableBlock` instead.
- `deleteSharedBlock` action has been removed. Use `deleteReusableBlock` instead.
- `updateSharedBlockTitle` action has been removed. Use `updateReusableBlockTitle` instead.
- `convertBlockToSaved` action has been removed. Use `convertBlockToReusable` instead.
- `getSharedBlock` selector has been removed. Use `getReusableBlock` instead.
- `isSavingSharedBlock` selector has been removed. Use `isSavingReusableBlock` instead.
- `isFetchingSharedBlock` selector has been removed. Use `isFetchingReusableBlock` instead.
- `getSharedBlocks` selector has been removed. Use `getReusableBlocks` instead.
- `editorMediaUpload` has been removed. Use `mediaUpload` instead.
- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
- `wp.editor.DocumentTitle` component has been removed.
- `getDocumentTitle` selector (`core/editor`) has been removed.

### Deprecations

- `wp.editor.RichTextProvider` flagged for deprecation. Please use `wp.data.select( 'core/editor' )` methods instead.

### Bug Fixes

- The `PostTextEditor` component will respect its in-progress state edited value, even if the assigned prop value changes.
