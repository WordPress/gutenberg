## 4.0.0 (Unreleased)

### Breaking Changes

- `getColorName` has been removed. Use `getColorObjectByColorValue` instead.
- `getColorClass` has been renamed. Use `getColorClassName` instead.
- The `value` property in color objects passed by `withColors` has been removed. Use `color` property instead.
- `RichText` `getSettings` prop has been removed. The `unstableGetSettings` prop is available if continued use is required. Unstable APIs are strongly discouraged to be used, and are subject to removal without notice, even as part of a minor release.
- `RichText` `onSetup` prop has been removed. The `unstableOnSetup` prop is available if continued use is required. Unstable APIs are strongly discouraged to be used, and are subject to removal without notice, even as part of a minor release.

### Deprecations

- The `checkTemplateValidity` action has been deprecated. Validity is verified automatically upon block reset.

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
- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
- `wp.editor.DocumentTitle` component has been removed.
- `getDocumentTitle` selector (`core/editor`) has been removed.

### Deprecation

- `wp.editor.RichTextProvider` flagged for deprecation. Please use `wp.data.select( 'core/editor' )` methods instead.

### Bug Fixes

- The `PostTextEditor` component will respect its in-progress state edited value, even if the assigned prop value changes.
