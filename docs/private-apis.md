# Gutenberg Private APIs

This is an overview of private APIs exposed by Gutenberg packages. These APIs are used to implement parts of the Gutenberg editor (Post Editor, Site Editor, Core blocks and others) but are not exposed publicly to plugin and theme authors or authors of custom Gutenberg integrations.

The purpose of this document is to present a picture of how many private APIs we have and how they are used to build the Gutenberg editor apps with the libraries and frameworks provided by the family of `@wordpress/*` packages.

## data

The registry has two private methods:
- `privateActionsOf`
- `privateSelectorsOf`

Every store has a private API for registering private selectors/actions:
- `privateActions`
- `registerPrivateActions`
- `privateSelectors`
- `registerPrivateSelectors`

## blocks

### `core/blocks` store

Private actions:
- `addBlockBindingsSource`
- `removeBlockBindingsSource`
- `addBootstrappedBlockType`
- `addUnprocessedBlockType`

Private selectors:
- `getAllBlockBindingsSources`
- `getBlockBindingsSource`
- `getBootstrappedBlockType`
- `getSupportedStyles`
- `getUnprocessedBlockTypes`
- `hasContentRoleAttribute`

## components

Private exports:
- `__experimentalPopoverLegacyPositionToPlacement`
- `ComponentsContext`
- `Tabs`
- `Theme`
- `Menu`
- `kebabCase`

## commands

Private exports:
- `useCommandContext` (added May 2023 in #50543)

### `core/commands` store

Private actions:
- `setContext` (added together with `useCommandContext`)

## preferences

Private exports: (added in Jan 2024 in #57639)
- `PreferenceBaseOption`
- `PreferenceToggleControl`
- `PreferencesModal`
- `PreferencesModalSection`
- `PreferencesModalTabs`

There is only one publicly exported component!
- `PreferenceToggleMenuItem`

## block-editor

Private exports:
- `AdvancedPanel`
- `BackgroundPanel`
- `BorderPanel`
- `ColorPanel`
- `DimensionsPanel`
- `FiltersPanel`
- `GlobalStylesContext`
- `ImageSettingsPanel`
- `TypographyPanel`
- `areGlobalStyleConfigsEqual`
- `getBlockCSSSelector`
- `getBlockSelectors`
- `getGlobalStylesChanges`
- `getLayoutStyles`
- `toStyles`
- `useGlobalSetting`
- `useGlobalStyle`
- `useGlobalStylesOutput`
- `useGlobalStylesOutputWithConfig`
- `useGlobalStylesReset`
- `useHasBackgroundPanel`
- `useHasBorderPanel`
- `useHasBorderPanelControls`
- `useHasColorPanel`
- `useHasDimensionsPanel`
- `useHasFiltersPanel`
- `useHasImageSettingsPanel`
- `useHasTypographyPanel`
- `useSettingsForBlockElement`
- `ExperimentalBlockCanvas`: version of public `BlockCanvas` that has several extra props: `contentRef`, `shouldIframe`, `iframeProps`.
- `ExperimentalBlockEditorProvider`: version of public `BlockEditorProvider` that filters out several private/experimental settings. See also `__experimentalUpdateSettings`.
- `getDuotoneFilter`
- `getRichTextValues`
- `PrivateQuickInserter`
- `extractWords`
- `getNormalizedSearchTerms`
- `normalizeString`
- `PrivateListView`
- `ResizableBoxPopover`
- `BlockInfo`
- `useHasBlockToolbar`
- `cleanEmptyObject`
- `BlockQuickNavigation`
- `LayoutStyle`
- `BlockRemovalWarningModal`
- `useLayoutClasses`
- `useLayoutStyles`
- `DimensionsTool`
- `ResolutionTool`
- `TabbedSidebar`
- `TextAlignmentControl`
- `usesContextKey`
- `useFlashEditableBlocks`
- `useZoomOut`
- `globalStylesDataKey`
- `globalStylesLinksDataKey`
- `selectBlockPatternsKey`
- `requiresWrapperOnCopy`
- `PrivateRichText`: has an extra prop `readOnly` added in #58916 and #60327 (Feb and Mar 2024).
- `PrivateInserterLibrary`: has an extra prop `onPatternCategorySelection` added in #62130 (May 2024).
- `reusableBlocksSelectKey`
- `PrivateBlockPopover`: has two extra props, `__unstableContentRef` and `__unstablePopoverSlot`.
- `PrivatePublishDateTimePicker`: version of public `PublishDateTimePicker` that has two extra props: `isCompact` and `showPopoverHeaderActions`.
- `useSpacingSizes`
- `useBlockDisplayTitle`
- `__unstableBlockStyleVariationOverridesWithConfig`
- `setBackgroundStyleDefaults`
- `sectionRootClientIdKey`
- `__unstableCommentIconFill`
- `__unstableCommentIconToolbarFill`

### `core/block-editor` store

Private actions:
- `__experimentalUpdateSettings`: version of public `updateSettings` action that filters out some private/experimental settings.
- `clearBlockRemovalPrompt`
- `deleteStyleOverride`
- `ensureDefaultBlock`
- `expandBlock`
- `hideBlockInterface`
- `modifyContentLockBlock`
- `privateRemoveBlocks`
- `resetZoomLevel`
- `setBlockRemovalRules`
- `setInsertionPoint`
- `setLastFocus`
- `setOpenedBlockSettingsMenu`
- `setStyleOverride`
- `setZoomLevel`
- `showBlockInterface`
- `startDragging`
- `stopDragging`
- `stopEditingAsBlocks`

Private selectors:
- `getAllPatterns`
- `getBlockRemovalRules`
- `getBlockSettings`
- `getBlockStyles`
- `getBlockWithoutAttributes`
- `getClosestAllowedInsertionPoint`
- `getClosestAllowedInsertionPointForPattern`
- `getContentLockingParent`
- `getEnabledBlockParents`
- `getEnabledClientIdsTree`
- `getExpandedBlock`
- `getInserterMediaCategories`
- `getInsertionPoint`
- `getLastFocus`
- `getLastInsertedBlocksClientIds`
- `getOpenedBlockSettingsMenu`
- `getParentSectionBlock`
- `getPatternBySlug`
- `getRegisteredInserterMediaCategories`
- `getRemovalPromptData`
- `getReusableBlocks`
- `getSectionRootClientId`
- `getStyleOverrides`
- `getTemporarilyEditingAsBlocks`
- `getTemporarilyEditingFocusModeToRevert`
- `getZoomLevel`
- `hasAllowedPatterns`
- `isBlockInterfaceHidden`
- `isBlockSubtreeDisabled`
- `isDragging`
- `isResolvingPatterns`
- `isSectionBlock`
- `isZoomOut`

## core-data

Private exports:
- `useEntityRecordsWithPermissions`

### `core` store

Private actions:
- `receiveRegisteredPostMeta`
- `editMediaEntity`

Private selectors:
- `getBlockPatternsForPostType`
- `getEntityRecordPermissions`
- `getEntityRecordsPermissions`
- `getNavigationFallbackId`
- `getRegisteredPostMeta`
- `getUndoManager`

## patterns (package created in Aug 2023 and has no public exports, everything is private)

Private exports:
- `OverridesPanel`
- `CreatePatternModal`
- `CreatePatternModalContents`
- `DuplicatePatternModal`
- `isOverridableBlock`
- `hasOverridableBlocks`
- `useDuplicatePatternProps`
- `RenamePatternModal`
- `PatternsMenuItems`
- `RenamePatternCategoryModal`
- `PatternOverridesControls`
- `ResetOverridesControl`
- `PatternOverridesBlockControls`
- `useAddPatternCategory`
- `PATTERN_TYPES`
- `PATTERN_DEFAULT_CATEGORY`
- `PATTERN_USER_CATEGORY`
- `EXCLUDED_PATTERN_SOURCES`
- `PATTERN_SYNC_TYPES`
- `PARTIAL_SYNCING_SUPPORTED_BLOCKS`

### `core/patterns` store

Private actions:
- `convertSyncedPatternToStatic`
- `createPattern`
- `createPatternFromFile`
- `setEditingPattern`

Private selectors:
- `isEditingPattern`

## block-library

Private exports:
- `BlockKeyboardShortcuts`

## router (private exports only)

Private exports:
- `useHistory`
- `useLocation`
- `RouterProvider`

## core-commands (private exports only)

Private exports:
- `useCommands`

## editor

Private exports:
- `CreateTemplatePartModal`
- `BackButton`
- `EntitiesSavedStatesExtensible`
- `Editor`
- `EditorContentSlotFill`
- `PluginPostExcerpt`
- `PostCardPanel`
- `PreferencesModal`
- `usePostActions`
- `ToolsMoreMenuGroup`
- `ViewMoreMenuGroup`
- `ResizableEditor`
- `registerCoreBlockBindingsSources`
- `interfaceStore`
- `ActionItem`
- `ComplementaryArea`
- `ComplementaryAreaMoreMenuItem`
- `FullscreenMode`
- `InterfaceSkeleton`
- `PinnedItems`

### `core/editor` store

Private actions:
- `createTemplate`
- `hideBlockTypes`
- `registerEntityAction`
- `registerPostTypeActions`
- `removeTemplates`
- `revertTemplate`
- `saveDirtyEntities`
- `setCurrentTemplateId`
- `setIsReady`
- `showBlockTypes`
- `unregisterEntityAction`

Private selectors:
- `getEntityActions`
- `getInserter`
- `getInserterSidebarToggleRef`
- `getListViewToggleRef`
- `getPostBlocksByName`
- `getPostIcon`
- `hasPostMetaChanges`
- `isEntityReady`

## edit-post

### `core/edit-post` store

Private selectors:
- `getEditedPostTemplateId`

## edit-site

### `core/edit-site` store

Private actions:
- `registerRoute`
- `setEditorCanvasContainerView`

Private selectors:
- `getRoutes`
- `getEditorCanvasContainerView`
