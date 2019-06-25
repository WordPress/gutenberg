# Deprecations

For features included in the Gutenberg plugin, the deprecation policy is intended to support backward compatibility for two minor plugin releases, when possible. Features and code included in a stable release of WordPress are not included in this deprecation timeline, and are instead subject to the [versioning policies of the WordPress project](https://make.wordpress.org/core/handbook/about/release-cycle/version-numbering/). The current deprecations are listed below and are grouped by _the version at which they will be removed completely_. If your plugin depends on these behaviors, you must update to the recommended alternative before the noted version.

## 5.5.0

- The PHP function `gutenberg_init` has been removed.
- The PHP function `is_gutenberg_page` has been removed. Use [`WP_Screen::is_block_editor`](https://developer.wordpress.org/reference/classes/wp_screen/is_block_editor/) instead.
- The PHP function `the_gutenberg_project` has been removed.
- The PHP function `gutenberg_default_post_format_template` has been removed.
- The PHP function `gutenberg_get_available_image_sizes` has been removed.
- The PHP function `gutenberg_get_autosave_newer_than_post_save` has been removed.
- The PHP function `gutenberg_editor_scripts_and_styles` has been removed.

## 5.4.0

- The PHP function `gutenberg_load_plugin_textdomain` has been removed.
- The PHP function `gutenberg_get_jed_locale_data` has been removed.
- The PHP function `gutenberg_load_locale_data` has been removed.

## 5.3.0

- The PHP function `gutenberg_redirect_to_classic_editor_when_saving_posts` has been removed.
- The PHP function `gutenberg_revisions_link_to_editor` has been removed.
- The PHP function `gutenberg_remember_classic_editor_when_saving_posts` has been removed.
- The PHP function `gutenberg_can_edit_post_type` has been removed. Use [`use_block_editor_for_post_type`](https://developer.wordpress.org/reference/functions/use_block_editor_for_post_type/) instead.
- The PHP function `gutenberg_can_edit_post` has been removed. Use [`use_block_editor_for_post`](https://developer.wordpress.org/reference/functions/use_block_editor_for_post/) instead.

## 5.2.0

- The PHP function `gutenberg_parse_blocks` has been removed. Use [`parse_blocks`](https://developer.wordpress.org/reference/functions/parse_blocks/) instead.
- The PHP function `get_dynamic_blocks_regex` has been removed.
- The PHP function `gutenberg_render_block` has been removed. Use [`render_block`](https://developer.wordpress.org/reference/functions/render_block/) instead.
- The PHP function `strip_dynamic_blocks` has been removed. For use in excerpt preparation, consider [`excerpt_remove_blocks`](https://developer.wordpress.org/reference/functions/excerpt_remove_blocks/) instead.
- The PHP function `strip_dynamic_blocks_add_filter` has been removed.
- The PHP function `strip_dynamic_blocks_remove_filter` has been removed.
- The PHP function `gutenberg_post_has_blocks` has been removed. Use [`has_blocks`](https://developer.wordpress.org/reference/functions/has_blocks/) instead.
- The PHP function `gutenberg_content_has_blocks` has been removed. Use [`has_blocks`](https://developer.wordpress.org/reference/functions/has_blocks/) instead.
- The PHP function `gutenberg_register_rest_routes` has been removed.
- The PHP function `gutenberg_add_taxonomy_visibility_field` has been removed.
- The PHP function `gutenberg_get_taxonomy_visibility_data` has been removed.
- The PHP function `gutenberg_add_permalink_template_to_posts` has been removed.
- The PHP function `gutenberg_add_block_format_to_post_content` has been removed.
- The PHP function `gutenberg_add_target_schema_to_links` has been removed.
- The PHP function `gutenberg_register_post_prepare_functions` has been removed.
- The PHP function `gutenberg_silence_rest_errors` has been removed.
- The PHP function `gutenberg_filter_post_type_labels` has been removed.
- The PHP function `gutenberg_preload_api_request` has been removed. Use [`rest_preload_api_request`](https://developer.wordpress.org/reference/functions/rest_preload_api_request/) instead.
- The PHP function `gutenberg_remove_wpcom_markdown_support` has been removed.
- The PHP function `gutenberg_add_gutenberg_post_state` has been removed.
- The PHP function `gutenberg_bulk_post_updated_messages` has been removed.
- The PHP function `gutenberg_kses_allowedtags` has been removed.
- The PHP function `gutenberg_add_responsive_body_class` has been removed.
- The PHP function `gutenberg_add_edit_link_filters` has been removed.
- The PHP function `gutenberg_add_edit_link` has been removed.
- The PHP function `gutenberg_block_bulk_actions` has been removed.
- The PHP function `gutenberg_replace_default_add_new_button` has been removed.
- The PHP function `gutenberg_content_block_version` has been removed. Use [`block_version`](https://developer.wordpress.org/reference/functions/block_version/) instead.
- The PHP function `gutenberg_get_block_categories` has been removed. Use [`get_block_categories`](https://developer.wordpress.org/reference/functions/get_block_categories/) instead.
- The PHP function `register_tinymce_scripts` has been removed. Use [`wp_register_tinymce_scripts`](https://developer.wordpress.org/reference/functions/wp_register_tinymce_scripts/) instead.
- The PHP function `gutenberg_register_post_types` has been removed.
- The `gutenberg` theme support option has been removed. Use [`align-wide`](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#wide-alignment) instead.
- The PHP function `gutenberg_prepare_blocks_for_js` has been removed. Use [`get_block_editor_server_block_settings`](https://developer.wordpress.org/reference/functions/get_block_editor_server_block_settings/) instead.
- The PHP function `gutenberg_load_list_reusable_blocks` has been removed.
- The PHP function `_gutenberg_utf8_split` has been removed. Use `_mb_substr` instead.
- The PHP function `gutenberg_disable_editor_settings_wpautop` has been removed.
- The PHP function `gutenberg_add_rest_nonce_to_heartbeat_response_headers` has been removed.
- The PHP function `gutenberg_check_if_classic_needs_warning_about_blocks` has been removed.
- The PHP function `gutenberg_warn_classic_about_blocks` has been removed.
- The PHP function `gutenberg_show_privacy_policy_help_text` has been removed.
- The PHP function `gutenberg_common_scripts_and_styles` has been removed. Use [`wp_common_block_scripts_and_styles`](https://developer.wordpress.org/reference/functions/wp_common_block_scripts_and_styles/) instead.
- The PHP function `gutenberg_enqueue_registered_block_scripts_and_styles` has been removed. Use [`wp_enqueue_registered_block_scripts_and_styles`](https://developer.wordpress.org/reference/functions/wp_enqueue_registered_block_scripts_and_styles/) instead.
- The PHP function `gutenberg_meta_box_save` has been removed.
- The PHP function `gutenberg_meta_box_save_redirect` has been removed.
- The PHP function `gutenberg_filter_meta_boxes` has been removed.
- The PHP function `gutenberg_intercept_meta_box_render` has been removed.
- The PHP function `gutenberg_override_meta_box_callback` has been removed.
- The PHP function `gutenberg_show_meta_box_warning` has been removed.
- The PHP function `the_gutenberg_metaboxes` has been removed. Use [`the_block_editor_meta_boxes`](https://developer.wordpress.org/reference/functions/the_block_editor_meta_boxes/) instead.
- The PHP function `gutenberg_meta_box_post_form_hidden_fields` has been removed. Use [`the_block_editor_meta_box_post_form_hidden_fields`](https://developer.wordpress.org/reference/functions/the_block_editor_meta_box_post_form_hidden_fields/) instead.
- The PHP function `gutenberg_toggle_custom_fields` has been removed.
- The PHP function `gutenberg_collect_meta_box_data` has been removed. Use [`register_and_do_post_meta_boxes`](https://developer.wordpress.org/reference/functions/register_and_do_post_meta_boxes/) instead.
- `window._wpLoadGutenbergEditor` has been removed. Use `window._wpLoadBlockEditor` instead. Note: This is a private API, not intended for public use. It may be removed in the future.
- The PHP function `gutenberg_get_script_polyfill` has been removed. Use [`wp_get_script_polyfill`](https://developer.wordpress.org/reference/functions/wp_get_script_polyfill/) instead.
- The PHP function `gutenberg_add_admin_body_class` has been removed. Use the `.block-editor-page` class selector in your stylesheets if you need to scope styles to the block editor screen.

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
 - Raw TinyMCE event handlers for `RichText` have been deprecated. Please use [documented props](/packages/editor/src/components/rich-text/README.md), ancestor event handler, or onSetup access to the internal editor instance event hub instead.

## 2.8.0

 - `Original autocompleter interface in wp.components.Autocomplete` updated. Please use `latest autocompleter interface` instead. See [autocomplete](/packages/components/src/autocomplete/README.md) for more info.
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
 - `wp.blocks.source.*` matchers removed. Please use the declarative attributes instead. See [block attributes](/docs/designers-developers/developers/block-api/block-attributes.md) for more info.
 - `wp.data.select( 'selector', ...args )` removed. Please use `wp.data.select( reducerKey' ).*` instead.
 - `wp.blocks.MediaUploadButton` component removed. Please use `wp.blocks.MediaUpload` component instead.
