# Slot Reference

Slot and Fill are components that have been exposed to allow developers to inject items into some predefined places in the Gutenberg admin experience.
Please see the [official docs](https://wordpress.org/gutenberg/handbook/designers-developers/developers/components/slot-fill/) for more details.

In order to use them, we must leverage the [@wordpress/plugins](https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/packages-plugins/) api to register a plugin that will inject our items.

## Usage overview

In order to access the slotFills, we need to do four things:

1. Import the `registerPlugin` method from `wp.plugins`.
2. Import the slotFill we want from `wp.editPost`.
3. Define a method to render our changes. Our changes/additions will be wrapped in the slotFill component we imported.
4. Register the plugin.



Here is an example using the `PluginPostStatusInfo` slotFill:
```js
const { registerPlugin } = wp.plugins;
const { PluginPostStatusInfo } = wp.editPost;


const PluginPostStatusInfoTest = () => {
	return(
		<PluginPostStatusInfo>
			<p>Post Status Info SlotFill</p>
		</PluginPostStatusInfo>
	)
}

registerPlugin( 'post-status-info-test', { render: PluginPostStatusInfoTest } );
```

## How do they work?

SlotFills are created using `createSlotFill`. This creates two components, `Slot` and `Fill` which are then used to create a new component that is exported on the `wp.plugins` global.

**Definition of the `PluginPostStatusInfo` SlotFill**
```js
/**
 * Defines as extensibility slot for the Status & Visibility panel.
 */

/**
 * WordPress dependencies
 */
import { createSlotFill, PanelRow } from '@wordpress/components';

export const { Fill, Slot } = createSlotFill( 'PluginPostStatusInfo' );

const PluginPostStatusInfo = ( { children, className } ) => (
	<Fill>
		<PanelRow className={ className }>
			{ children }
		</PanelRow>
	</Fill>
);

PluginPostStatusInfo.Slot = Slot;

export default PluginPostStatusInfo;

```

This new Slot is then exposed in the editor. The example below is from core and represents the Status & Visibility panel.

As we can see, the `<PluginPostStatusInfo.Slot>` is wrapping all of the items that will appear in the panel.
Any items that have been added via the SlotFill ( see the example above ), will be included in the `fills` parameter and be displayed betwee the `<PostAuthor/>` and `<PostTrash/>` components.

**Core**
```js
function PostStatus( { isOpened, onTogglePanel } ) {
	return (
		<PanelBody className="edit-post-post-status" title={ __( 'Status & Visibility' ) } opened={ isOpened } onToggle={ onTogglePanel }>
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
}
```
## Currently available slotFills and examples

There are currently seven available slotFills please refer to the individual items below for usage and example details:

* [PluginSidebar](./plugin-sidebar.md)
* [PluginMoreMenuItem](./plugin-more-menu-item.md)
* [PluginSidebarMoreMenu](./plugin-sidebar-more-menu-item.md)
* [PluginPostStatusInfo](./plugin-post-status-info.md)
* [PluginBlockSettingsMenuItem](./plugin-block-settings-menu-item.md)
* [PluginPrePublishPanel](./plugin-pre-post-publish-panel.md)
* [PluginPostPublishPanel](./plugin-post-publish-panel.md)
