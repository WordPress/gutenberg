# Gutenberg Private APIs

This is an overview of private APIs exposed by Gutenberg packages. These APIs are used to implement parts of the Gutenberg editor (Post Editor, Site Editor, Core blocks and others) but are not exposed publicly to plugin and theme authors or authors of custom Gutenberg integrations.

The purpose of this document is to present a picture of how many private APIs we have and how they are used to build the Gutenberg editor apps with the libraries and frameworks provided by the family of `@wordpress/*` packages.

## Bundled packages and externalized dependencies

Some `@wordpress/*` packages are **bundled** into the consumer's build output, while others are **externalized** and provided at runtime by WordPress or the Gutenberg plugin.

`@wordpress/scripts`, `@wordpress/build`, and `@wordpress/dependency-extraction-webpack-plugin` externalize `@wordpress/*` imports to `wp.*` globals unless the package is listed in `BUNDLED_PACKAGES`. See the [@wordpress/dependency-extraction-webpack-plugin README](/packages/dependency-extraction-webpack-plugin/README.md) and [@wordpress/build README](/packages/wp-build/README.md) for details.

### Why this matters for private APIs

Bundled packages may rely on private APIs from externalized packages, but the two package types version independently at runtime. Any use of a private API must be backwards compatible when the API is introduced, promoted to public, or deprecated.

This section is about coordination between `@wordpress/*` packages, not third-party plugin or theme authors. Most consumers are not calling `unlock()` on externalized private APIs themselves; they inherit the dependency indirectly by bundling a package such as `@wordpress/ui`, which may use `ThemeProvider` from `@wordpress/theme` privately. Third-party code that imports and unlocks private APIs directly is knowingly using unsupported APIs and accepts that risk. The compatibility concern is when a **bundled** `@wordpress/*` package depends on a private API from an **externalized** one: the plugin pins the bundled code at build time, but WordPress supplies the externalized global at runtime, so consumers can break without changing their own code.

Do not assume:

- **The private API exists without the Gutenberg plugin.** WordPress Core may not ship the externalized package (or the private export) until a later release. Guard usage.
- **A private API in Core behaves like one in the Gutenberg plugin.** The Gutenberg plugin and thus NPM package releases leads WordPress stable releases; an API may be public in the plugin while WordPress still only exposes it through `privateApis`, or not at all.
- **A private export stays available after promotion.** When Gutenberg makes an API public, the locked data is typically removed from `privateApis`. Bundled code that still calls `unlock()` breaks even though the API is now available as a public export.

Example of the promotion mismatch:

1. A plugin bundles `@wordpress/ui@0.12.0`, which calls `unlock( themePrivateApis ).ThemeProvider`.
2. The plugin's build externalizes `@wordpress/theme` to `window.wp.theme`.
3. Gutenberg removes `ThemeProvider` from `privateApis` and exports it publicly.
4. The bundled `@wordpress/ui` code still calls `unlock()`, which throws because the runtime `privateApis` object no longer contains the locked data.

The reverse is also true: a bundled package that switches to a public import only will fail on older WordPress versions that still expose the API only through `privateApis`.

Resolve APIs at runtime when supporting multiple WordPress/Gutenberg versions.

### Removing private API usage from a bundled package

When a bundled package currently uses `unlock( privateApis )` against an externalized dependency, migrate it to the public export using the steps below.

#### 1. Wait for the public API to exist in the externalized package

The externalized package must export the API publicly before the bundled package can stop using `unlock()`. Do not remove the private export until grace period has passed.

#### 2. Replace `unlock()` with a public import

```js
// Before
import { privateApis as themePrivateApis } from '@wordpress/theme';
import { unlock } from '../lock-unlock';

const ThemeProvider = unlock( themePrivateApis ).ThemeProvider;

// After
import { ThemeProvider } from '@wordpress/theme';
```

Remove the `lock-unlock` import if it is no longer needed.

#### 3. Add a runtime fallback when supporting multiple WordPress versions

If the bundled package must work on WordPress versions that only expose the API privately, resolve it at runtime instead of picking one approach at build time:

```js
import {
	ThemeProvider as PublicThemeProvider,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../lock-unlock';

function getThemeProvider() {
	if ( PublicThemeProvider ) {
		return PublicThemeProvider;
	}

	try {
		return unlock( themePrivateApis ).ThemeProvider;
	} catch {
		throw new Error(
			'ThemeProvider is not available. Update WordPress or the Gutenberg plugin.'
		);
	}
}

const ThemeProvider = getThemeProvider();
```

Use this pattern to help consumers to support both a WordPress release that only has the private export and a newer release with the public export.

#### 4. Bump the bundled package version and document the change

Switching from a private to a public API is a breaking change for consumers running older WordPress versions. Treat it as a semver-major release of the bundled package.

### Promoting a private API to public (externalized package maintainers)

When making a private API public in an externalized package, follow this sequence to avoid breaking bundled dependents:

1. **Add the public export** without removing the private one.
2. **Deprecate the private export** using `@wordpress/deprecated`, targeting a specific WordPress version for removal.
3. **Migrate in-repo consumers first**, including any bundled packages.
4. **Publish the updated bundled packages** and announce the change so npm consumers can update.
5. **Keep both exports during a grace period** (typically one or two WordPress releases) so plugins that have not yet updated their bundled dependencies continue to work.
6. **Remove the private export** only after the grace period ends.

Do not remove a private API from an externalized package while bundled packages published to npm still depend on it via `unlock()`.

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
- `ImageSettingsPanel`
- `TypographyPanel`
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
- `BlockStyleVariationOverridesWithConfig`
- `setBackgroundStyleDefaults`
- `sectionRootClientIdKey`
- `NoteIconSlotFill`
- `NoteIconToolbarSlotFill`

### `core/block-editor` store

Private actions:
- `__experimentalUpdateSettings`: version of public `updateSettings` action that filters out some private/experimental settings.
- `clearBlockRemovalPrompt`
- `clearRequestedInspectorTab`
- `deleteStyleOverride`
- `ensureDefaultBlock`
- `expandBlock`
- `hideBlockInterface`
- `modifyContentLockBlock`
- `privateRemoveBlocks`
- `requestInspectorTab`
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
- `getRequestedInspectorTab`
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
