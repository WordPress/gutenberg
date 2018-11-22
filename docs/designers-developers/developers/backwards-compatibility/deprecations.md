# Deprecations

Gutenberg's deprecation policy is intended to support backwards-compatibility for releases, when possible. The current deprecations are listed below and are grouped by _the version at which they will be removed completely_. If your plugin depends on these behaviors, you must update to the recommended alternative before the noted version.

## 4.5.0
- `Dropdown.refresh()` has been deprecated as the contained `Popover` is now automatically refreshed.
- `wp.editor.PostPublishPanelToggle` has been deprecated in favor of `wp.editor.PostPublishButton`.

## 4.4.0

- `wp.date.getSettings` has been removed. Please use `wp.date.__experimentalGetSettings` instead.
- `wp.compose.remountOnPropChange` has been removed.
- The following editor store actions have been removed: `createNotice`, `removeNotice`, `createSuccessNotice`, `createInfoNotice`, `createErrorNotice`, `createWarningNotice`. Use the equivalent actions by the same name from the `@wordpress/notices` module.
- The id prop of wp.nux.DotTip has been removed. Please use the tipId prop instead.
- `wp.blocks.isValidBlock` has been removed. Please use `wp.blocks.isValidBlockContent` instead but keep in mind that the order of params has changed.
- `wp.data` `registry.registerReducer` has been deprecated. Use `registry.registerStore` instead.
- `wp.data` `registry.registerSelectors` has been deprecated. Use `registry.registerStore` instead.
- `wp.data` `registry.registerActions` has been deprecated. Use `registry.registerStore` instead.
- `wp.data` `registry.registerResolvers` has been deprecated. Use `registry.registerStore` instead.
- `moment` has been removed from the public API for the date module.

## 4.3.0

- `isEditorSidebarPanelOpened` selector (`core/edit-post`) has been removed. Please use `isEditorPanelEnabled` instead.
- `toggleGeneralSidebarEditorPanel` action (`core/edit-post`) has been removed. Please use `toggleEditorPanelOpened` instead.
- `wp.components.PanelColor` component has been removed. Please use `wp.editor.PanelColorSettings` instead.
- `wp.editor.PanelColor` component has been removed. Please use `wp.editor.PanelColorSettings` instead.

## 4.2.0

- Writing resolvers as async generators has been removed. Use the controls plugin instead.
- `wp.components.AccessibleSVG` component has been removed. Please use `wp.components.SVG` instead.
- The `wp.editor.UnsavedChangesWarning` component no longer accepts a `forceIsDirty` prop.
- `setActiveMetaBoxLocations` action (`core/edit-post`) has been removed.
- `initializeMetaBoxState` action (`core/edit-post`) has been removed.
- `wp.editPost.initializeEditor` no longer returns an object. Use the `setActiveMetaBoxLocations` action (`core/edit-post`) in place of the existing object's `initializeMetaBoxes` function.
- `setMetaBoxSavedData` action (`core/edit-post`) has been removed.
- `getMetaBoxes` selector (`core/edit-post`) has been removed. Use `getActiveMetaBoxLocations` selector (`core/edit-post`) instead.
- `getMetaBox` selector (`core/edit-post`) has been removed. Use `isMetaBoxLocationActive` selector (`core/edit-post`) instead.
- Attribute type coercion has been removed. Omit the source to preserve type via serialized comment demarcation.
- `mediaDetails` in object passed to `onFileChange` callback of `wp.editor.mediaUpload`. Please use `media_details` property instead.
- `wp.components.CodeEditor` has been removed. Used `wp.codeEditor` directly instead.
- `wp.blocks.setUnknownTypeHandlerName` has been removed. Please use `setFreeformContentHandlerName` and `setUnregisteredTypeHandlerName` instead.
- `wp.blocks.getUnknownTypeHandlerName` has been removed. Please use `getFreeformContentHandlerName` and `getUnregisteredTypeHandlerName` instead.
- The Reusable Blocks Data API was marked as experimental as it's subject to change in the future.

## 4.1.0

- `wp.data.dispatch( 'core/editor' ).checkTemplateValidity` has been removed. Validity is verified automatically upon block reset.

## 4.0.0

- `wp.editor.RichTextProvider` has been removed. Please use `wp.data.select( 'core/editor' )` methods instead.
- `wp.components.Draggable` as a DOM node drag handler has been removed. Please, use `wp.components.Draggable` as a wrap component for your DOM node drag handler.
- `wp.i18n.getI18n` has been removed. Use `__`, `_x`, `_n`, or `_nx` instead.
- `wp.i18n.dcnpgettext` has been removed. Use `__`, `_x`, `_n`, or `_nx` instead.

## 3.9.0

- RichText `getSettings` prop has been removed. The `unstableGetSettings` prop is available if continued use is required. Unstable APIs are strongly discouraged to be used, and are subject to removal without notice.
- RichText `onSetup` prop has been removed. The `unstableOnSetup` prop is available if continued use is required. Unstable APIs are strongly discouraged to be used, and are subject to removal without notice.
- `wp.editor.getColorName` has been removed. Please use `wp.editor.getColorObjectByColorValue` instead.
- `wp.editor.getColorClass` has been renamed. Please use `wp.editor.getColorClassName` instead.
- `value` property in color objects passed by `wp.editor.withColors` has been removed. Please use color property instead.
- The Subheading block has been removed. Please use the Paragraph block instead.
- `wp.blocks.getDefaultBlockForPostFormat` has been removed.

## 3.8.0

 - `wp.components.withContext` has been removed. Please use `wp.element.createContext` instead. See: https://reactjs.org/docs/context.html.
 - `wp.coreBlocks.registerCoreBlocks` has been removed. Please use `wp.blockLibrary.registerCoreBlocks` instead.
 - `wp.editor.DocumentTitle` component has been removed.
 - `getDocumentTitle` selector (`core/editor`) has been removed.

## 3.7.0

 - `wp.components.withAPIData` has been removed. Please use the Core Data module or `wp.apiFetch` directly instead.
 - `wp.data.dispatch("core").receiveTerms` has been deprecated. Please use `wp.data.dispatch("core").receiveEntityRecords` instead.
 - `getCategories` resolver has been deprecated. Please use `getEntityRecords` resolver instead.
 - `wp.data.select("core").getTerms` has been deprecated. Please use `wp.data.select("core").getEntityRecords` instead.
 - `wp.data.select("core").getCategories` has been deprecated. Please use `wp.data.select("core").getEntityRecords` instead.
 - `wp.data.select("core").isRequestingCategories` has been deprecated. Please use `wp.data.select("core/data").isResolving` instead.
 - `wp.data.select("core").isRequestingTerms` has been deprecated. Please use `wp.data.select("core").isResolving` instead.
 - `wp.data.restrictPersistence`, `wp.data.setPersistenceStorage` and  `wp.data.setupPersistence` has been removed. Please use the data persistence plugin instead.

## 3.6.0

 - `wp.editor.editorMediaUpload` has been removed. Please use `wp.editor.mediaUpload` instead.
 - `wp.utils.getMimeTypesArray` has been removed.
 - `wp.utils.mediaUpload` has been removed. Please use `wp.editor.mediaUpload` instead.
 - `wp.utils.preloadImage` has been removed.
 - `supports.wideAlign` has been removed from the Block API. Please use `supports.alignWide` instead.
 - `wp.blocks.isSharedBlock` has been removed. Use `wp.blocks.isReusableBlock` instead.
 - `fetchSharedBlocks` action (`core/editor`) has been removed. Use `fetchReusableBlocks` instead.
 - `receiveSharedBlocks` action (`core/editor`) has been removed. Use `receiveReusableBlocks` instead.
 - `saveSharedBlock` action (`core/editor`) has been removed. Use `saveReusableBlock` instead.
 - `deleteSharedBlock` action (`core/editor`) has been removed. Use `deleteReusableBlock` instead.
 - `updateSharedBlockTitle` action (`core/editor`) has been removed. Use `updateReusableBlockTitle` instead.
 - `convertBlockToSaved` action (`core/editor`) has been removed. Use `convertBlockToReusable` instead.
 - `getSharedBlock` selector (`core/editor`) has been removed. Use `getReusableBlock` instead.
 - `isSavingSharedBlock` selector (`core/editor`) has been removed. Use `isSavingReusableBlock` instead.
 - `isFetchingSharedBlock` selector (`core/editor`) has been removed. Use `isFetchingReusableBlock` instead.
 - `getSharedBlocks` selector (`core/editor`) has been removed. Use `getReusableBlocks` instead.

## 3.5.0

 - `wp.components.ifCondition` has been removed. Please use `wp.compose.ifCondition` instead.
 - `wp.components.withGlobalEvents` has been removed. Please use `wp.compose.withGlobalEvents` instead.
 - `wp.components.withInstanceId` has been removed. Please use `wp.compose.withInstanceId` instead.
 - `wp.components.withSafeTimeout` has been removed. Please use `wp.compose.withSafeTimeout` instead.
 - `wp.components.withState` has been removed. Please use `wp.compose.withState` instead.
 - `wp.element.pure` has been removed. Please use `wp.compose.pure` instead.
 - `wp.element.compose` has been removed. Please use `wp.compose.compose` instead.
 - `wp.element.createHigherOrderComponent` has been removed. Please use `wp.compose.createHigherOrderComponent` instead.
 - `wp.utils.buildTermsTree` has been removed.
 - `wp.utils.decodeEntities` has been removed. Please use `wp.htmlEntities.decodeEntities` instead.
 - All references to a block's `uid` have been replaced with equivalent props and selectors for `clientId`.
 - The `wp.editor.MediaPlaceholder` component `onSelectUrl` prop has been renamed to `onSelectURL`.
 - The `wp.editor.UrlInput` component has been renamed to `wp.editor.URLInput`.
 - The Text Columns block has been removed. Please use the Columns block instead.
 - `InnerBlocks` grouped layout is removed. Use intermediary nested inner blocks instead. See Columns / Column block for reference implementation.
 - `RichText` explicit `element` format removed. Please use the compatible `children` format instead.

## 3.4.0

 - `focusOnMount` prop in the `Popover` component has been changed from `Boolean`-only to an enum-style property that accepts `"firstElement"`, `"container"`, or `false`. Please convert any `<Popover focusOnMount />` usage to `<Popover focusOnMount="firstElement" />`.
 - `wp.utils.keycodes` utilities are removed. Please use `wp.keycodes` instead.
 - Block `id` prop in `edit` function removed. Please use block `clientId` prop instead.
 - `property` source removed. Please use equivalent `text`, `html`, or `attribute` source, or comment attribute instead.

## 3.3.0

 - `useOnce: true` has been removed from the Block API. Please use `supports.multiple: false` instead.
 - Serializing components using `componentWillMount` lifecycle method. Please use the constructor instead.
 - `blocks.Autocomplete.completers` filter removed. Please use `editor.Autocomplete.completers` instead.
 - `blocks.BlockEdit` filter removed. Please use `editor.BlockEdit` instead.
 - `blocks.BlockListBlock` filter removed. Please use `editor.BlockListBlock` instead.
 - `blocks.MediaUpload` filter removed. Please use `editor.MediaUpload` instead.

## 3.2.0

 - `wp.data.withRehydratation` has been renamed to `wp.data.withRehydration`.
 - The `wp.editor.ImagePlaceholder` component is removed. Please use `wp.editor.MediaPlaceholder` instead.
 - `wp.utils.deprecated` function removed. Please use `wp.deprecated` instead.
 - `wp.utils.blob` removed. Please use `wp.blob` instead.
 - `getInserterItems`: the `allowedBlockTypes` argument was removed and the `parentUID` argument was added.
 - `getFrecentInserterItems` selector removed. Please use `getInserterItems` instead.
 - `getSupportedBlocks` selector removed. Please use `canInsertBlockType` instead.

## 3.1.0

 - All components in `wp.blocks.*` are removed. Please use `wp.editor.*` instead.
 - `wp.blocks.withEditorSettings` is removed. Please use the data module to access the editor settings `wp.data.select( "core/editor" ).getEditorSettings()`.
 - All DOM utils in `wp.utils.*` are removed. Please use `wp.dom.*` instead.
 - `isPrivate: true` has been removed from the Block API. Please use `supports.inserter: false` instead.
 - `wp.utils.isExtraSmall` function removed. Please use `wp.viewport` module instead.
 - `getEditedPostExcerpt` selector removed (`core/editor`). Use `getEditedPostAttribute( 'excerpt' )` instead.

## 3.0.0

 - `wp.blocks.registerCoreBlocks` function removed. Please use `wp.coreBlocks.registerCoreBlocks` instead.
 - Raw TinyMCE event handlers for `RichText` have been deprecated. Please use [documented props](https://wordpress.org/gutenberg/handbook/block-api/rich-text-api/), ancestor event handler, or onSetup access to the internal editor instance event hub instead.

## 2.8.0

 - `Original autocompleter interface in wp.components.Autocomplete` updated. Please use `latest autocompleter interface` instead. See: https://github.com/WordPress/gutenberg/blob/master/components/autocomplete/README.md.
 - `getInserterItems`: the `allowedBlockTypes` argument is now mandatory.
 - `getFrecentInserterItems`: the `allowedBlockTypes` argument is now mandatory.

## 2.7.0

 - `wp.element.getWrapperDisplayName` function removed. Please use `wp.element.createHigherOrderComponent` instead.

## 2.6.0

 - `wp.blocks.getBlockDefaultClassname` function removed. Please use `wp.blocks.getBlockDefaultClassName` instead.
 - `wp.blocks.Editable` component removed. Please use the `wp.blocks.RichText` component instead.

## 2.5.0

 - Returning raw HTML from block `save` is unsupported. Please use the `wp.element.RawHTML` component instead.
 - `wp.data.query` higher-order component removed. Please use `wp.data.withSelect` instead.

## 2.4.0

 - `wp.blocks.BlockDescription` component removed. Please use the `description` block property instead.
 - `wp.blocks.InspectorControls.*` components removed. Please use `wp.components.*` components instead.
 - `wp.blocks.source.*` matchers removed. Please use the declarative attributes instead. See: https://wordpress.org/gutenberg/handbook/block-api/attributes/.
 - `wp.data.select( 'selector', ...args )` removed. Please use `wp.data.select( reducerKey' ).*` instead.
 - `wp.blocks.MediaUploadButton` component removed. Please use `wp.blocks.MediaUpload` component instead.
