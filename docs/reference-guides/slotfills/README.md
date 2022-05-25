# SlotFills Reference

Slot and Fill are components that have been exposed to allow developers to inject items into some predefined places in the Gutenberg admin experience.
Please see the [SlotFill component docs](/packages/components/src/slot-fill/README.md) for more details.

In order to use them, we must leverage the [@wordpress/plugins](/packages/plugins/README.md) api to register a plugin that will inject our items.

## Usage overview

In order to access the SlotFills, we need to do four things:

1. Import the `registerPlugin` method from `wp.plugins`.
2. Import the SlotFill we want from `wp.editPost`.
3. Define a method to render our changes. Our changes/additions will be wrapped in the SlotFill component we imported.
4. Register the plugin.

Here is an example using the `PluginPostStatusInfo` slotFill:

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginPostStatusInfo } from '@wordpress/edit-post';

const PluginPostStatusInfoTest = () => (
	<PluginPostStatusInfo>
		<p>Post Status Info SlotFill</p>
	</PluginPostStatusInfo>
);

registerPlugin( 'post-status-info-test', { render: PluginPostStatusInfoTest } );
```

## How do they work?

SlotFills are created using `createSlotFill`. This creates two components, `Slot` and `Fill` which are then used to create a new component that is exported on the `wp.plugins` global.

**Definition of the `PluginPostStatusInfo` SlotFill** ([see core code](https://github.com/WordPress/gutenberg/blob/HEAD/packages/edit-post/src/components/sidebar/plugin-post-status-info/index.js#L54))

```js
/**
 * Defines as extensibility slot for the Status & visibility panel.
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

This new Slot is then exposed in the editor. The example below is from core and represents the Status & visibility panel.

As we can see, the `<PluginPostStatusInfo.Slot>` is wrapping all of the items that will appear in the panel.
Any items that have been added via the SlotFill ( see the example above ), will be included in the `fills` parameter and be displayed between the `<PostAuthor/>` and `<PostTrash/>` components.

See [core code](https://github.com/WordPress/gutenberg/tree/HEAD/packages/edit-post/src/components/sidebar/post-status/index.js#L26).

```js
const PostStatus = ( { isOpened, onTogglePanel } ) => (
	<PanelBody
		className="edit-post-post-status"
		title={ __( 'Status & visibility' ) }
		opened={ isOpened }
		onToggle={ onTogglePanel }
	>
		<PluginPostStatusInfo.Slot>
			{ ( fills ) => (
				<Fragment>
					<PostVisibility />
					<PostSchedule />
					<PostFormat />
					<PostSticky />
					<PostPendingStatus />
					<PostAuthor />
					{ fills }
					<PostTrash />
				</Fragment>
			) }
		</PluginPostStatusInfo.Slot>
	</PanelBody>
);
```

## Currently available SlotFills and examples

The following SlotFills are available in the `edit-post` package. Please refer to the individual items below for usage and example details:

-   [MainDashboardButton](/docs/reference-guides/slotfills/main-dashboard-button.md)
-   [PluginBlockSettingsMenuItem](/docs/reference-guides/slotfills/plugin-block-settings-menu-item.md)
-   [PluginDocumentSettingPanel](/docs/reference-guides/slotfills/plugin-document-setting-panel.md)
-   [PluginMoreMenuItem](/docs/reference-guides/slotfills/plugin-more-menu-item.md)
-   [PluginPostPublishPanel](/docs/reference-guides/slotfills/plugin-post-publish-panel.md)
-   [PluginPostStatusInfo](/docs/reference-guides/slotfills/plugin-post-status-info.md)
-   [PluginPrePublishPanel](/docs/reference-guides/slotfills/plugin-pre-publish-panel.md)
-   [PluginSidebar](/docs/reference-guides/slotfills/plugin-sidebar.md)
-   [PluginSidebarMoreMenuItem](/docs/reference-guides/slotfills/plugin-sidebar-more-menu-item.md)
