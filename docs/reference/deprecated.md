Gutenberg's deprecation policy is intended to support backwards-compatibility for two minor releases, when possible. The current deprecations are listed below and are grouped by _the version at which they will be removed completely_. If your plugin depends on these behaviors, you must update to the recommended alternative before the noted version.

## 3.8.0

 - `wp.coreBlocks.registerCoreBlocks` has been removed. Please use `wp.blockLibrary.registerCoreBlocks` instead.

## 3.7.0

 - `wp.components.withAPIData` has been removed. Please use the Core Data module or `wp.apiFetch` directly instead.
 - `wp.data.dispatch("core").receiveTerms` has been deprecated. Please use `wp.data.dispatch("core").receiveEntityRecords` instead.
 - `getCategories` resolvers has been deprecated. Please use `getEntityRecords` resolver instead.
 - `wp.data.select("core").getTerms` has been deprecated. Please use `wp.data.select("core").getEntityRecords` instead.
 - `wp.data.select("core").getCategories` has been deprecated. Please use `wp.data.select("core").getEntityRecords` instead.
 - `wp.data.select("core").isRequestingTerms` has been deprecated. Please use `wp.data.select("core").getEntitiesByKind` instead.

## 3.6.0

 - `wp.editor.editorMediaUpload` has been removed. Please use `wp.editor.mediaUpload` instead.
 - `wp.utils.getMimeTypesArray` has been removed.
 - `wp.utils.mediaUpload` has been removed. Please use `wp.editor.mediaUpload` instead.
 - `wp.utils.preloadImage` has been removed.
 - `supports.wideAlign` has been removed from the Block API. Please use `supports.alignWide` instead.

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
