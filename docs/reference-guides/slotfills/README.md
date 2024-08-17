# SlotFills Reference

Slot and Fill are components that have been exposed to allow developers to inject items into some predefined places in the Gutenberg admin experience.
Please see the [SlotFill component docs](/packages/components/src/slot-fill/README.md) for more details.

In order to use them, we must leverage the [@wordpress/plugins](/packages/plugins/README.md) api to register a plugin that will inject our items.

## Usage overview

In order to access the SlotFills, we need to do four things:

1. Import the `registerPlugin` method from `wp.plugins`.
2. Import the SlotFill we want from `wp.editor`.
3. Define a method to render our changes. Our changes/additions will be wrapped in the SlotFill component we imported.
4. Register the plugin.

Here is an example using the `PluginPostStatusInfo` slotFill:

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginPostStatusInfo } from '@wordpress/editor';

const PluginPostStatusInfoTest = () => (
	<PluginPostStatusInfo>
		<p>Post Status Info SlotFill</p>
	</PluginPostStatusInfo>
);

registerPlugin( 'post-status-info-test', { render: PluginPostStatusInfoTest } );
```

## How do they work?

SlotFills are created using `createSlotFill`. This creates two components, `Slot` and `Fill` which are then used to create a new component that is exported on the `wp.plugins` global.

**Definition of the `PluginPostStatusInfo` SlotFill** ([see core code](https://github.com/WordPress/gutenberg/blob/HEAD/packages/editor/src/components/plugin-post-status-info/index.js#L55))

```js
/**
 * Defines as extensibility slot for the Summary panel.
 */

/**
 * WordPress dependencies
 */
import { createSlotFill, PanelRow } from '@wordpress/components';

export const { Fill, Slot } = createSlotFill( 'PluginPostStatusInfo' );

const PluginPostStatusInfo = ( { children, className } ) => (
	<Fill>
		<PanelRow className={ className }>{ children }</PanelRow>
	</Fill>
);

PluginPostStatusInfo.Slot = Slot;

export default PluginPostStatusInfo;
```

This new Slot is then exposed in the editor. The example below is from core and represents the Summary panel.

As we can see, the `<PluginPostStatusInfo.Slot>` is wrapping all of the items that will appear in the panel.
Any items that have been added via the SlotFill ( see the example above ), will be included in the `fills` parameter and be displayed in the end of the component.

See [core code](https://github.com/WordPress/gutenberg/tree/HEAD/packages/editor/src/components/sidebar/post-summary.js#L39).

```js
export default function PostSummary( { onActionPerformed } ) {
	const { isRemovedPostStatusPanel } = useSelect( ( select ) => {
		// We use isEditorPanelRemoved to hide the panel if it was programmatically removed. We do
		// not use isEditorPanelEnabled since this panel should not be disabled through the UI.
		const { isEditorPanelRemoved } =
			select( editorStore );
		return {
			isRemovedPostStatusPanel: isEditorPanelRemoved( PANEL_NAME ),
		};
	}, [] );

	return (
		<PostPanelSection className="editor-post-summary">
			<PluginPostStatusInfo.Slot>
				{ ( fills ) => (
					<>
						<VStack spacing={ 4 }>
							<PostCardPanel
								onActionPerformed={ onActionPerformed }
							/>
							<PostFeaturedImagePanel withPanelBody={ false } />
							<PostExcerptPanel />
							<VStack spacing={ 1 }>
								<PostContentInformation />
								<PostLastEditedPanel />
							</VStack>
							{ ! isRemovedPostStatusPanel && (
								<VStack spacing={ 2 }>
									<VStack spacing={ 1 }>
										<PostStatusPanel />
										<PostSchedulePanel />
										<PostURLPanel />
										<PostAuthorPanel />
										<PostTemplatePanel />
										<PostDiscussionPanel />
										<PageAttributesPanel />
										<PostSyncStatus />
										<BlogTitle />
										<PostsPerPage />
										<SiteDiscussion />
										<PostFormatPanel />
										<PostStickyPanel />
									</VStack>
									<TemplateAreas />
									{ fills }
								</VStack>
							) }
						</VStack>
					</>
				) }
			</PluginPostStatusInfo.Slot>
		</PostPanelSection>
	);
}
```

## Currently available SlotFills and examples

The following SlotFills are available in the `edit-post` or `editor` packages. Please refer to the individual items below for usage and example details:

-   [MainDashboardButton](/docs/reference-guides/slotfills/main-dashboard-button.md)
-   [PluginBlockSettingsMenuItem](/docs/reference-guides/slotfills/plugin-block-settings-menu-item.md)
-   [PluginDocumentSettingPanel](/docs/reference-guides/slotfills/plugin-document-setting-panel.md)
-   [PluginMoreMenuItem](/docs/reference-guides/slotfills/plugin-more-menu-item.md)
-   [PluginPostPublishPanel](/docs/reference-guides/slotfills/plugin-post-publish-panel.md)
-   [PluginPostStatusInfo](/docs/reference-guides/slotfills/plugin-post-status-info.md)
-   [PluginPrePublishPanel](/docs/reference-guides/slotfills/plugin-pre-publish-panel.md)
-   [PluginSidebar](/docs/reference-guides/slotfills/plugin-sidebar.md)
-   [PluginSidebarMoreMenuItem](/docs/reference-guides/slotfills/plugin-sidebar-more-menu-item.md)
