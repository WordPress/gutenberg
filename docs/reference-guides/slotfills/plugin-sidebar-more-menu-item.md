# PluginSidebarMoreMenuItem

This slot is used to allow the opening of a `<PluginSidebar />` panel from the Options dropdown.
When a `<PluginSidebar />` is registered, a `<PluginSidebarMoreMenuItem />` is automatically registered using the title prop from the `<PluginSidebar />` and so it's not required to use this slot to create the menu item.

## Example

This example shows how customize the text for the menu item instead of using the default text provided by the `<PluginSidebar />` title.

```js
import { __ } from '@wordpress/i18n';
import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/editor';
import {
	PanelBody,
	Button,
	TextControl,
	SelectControl,
} from '@wordpress/components';
import { registerPlugin } from '@wordpress/plugins';
import { useState } from '@wordpress/element';
import { image } from '@wordpress/icons';

const PluginSidebarMoreMenuItemTest = () => {
	const [ text, setText ] = useState( '' );
	const [ select, setSelect ] = useState( 'a' );
	return (
		<>
			<PluginSidebarMoreMenuItem target="sidebar-name" icon={ image }>
				{ __( 'Custom Menu Item Text' ) }
			</PluginSidebarMoreMenuItem>
			<PluginSidebar
				name="sidebar-name"
				icon={ image }
				title="My Sidebar"
			>
				<PanelBody>
					<h2>
						{ __(
							'This is a heading for the PluginSidebar example.'
						) }
					</h2>
					<p>
						{ __(
							'This is some example text for the PluginSidebar example.'
						) }
					</p>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Text Control' ) }
						value={ text }
						onChange={ ( newText ) => setText( newText ) }
					/>
					<SelectControl
						label={ __( 'Select Control' ) }
						value={ select }
						options={ [
							{ value: 'a', label: __( 'Option A' ) },
							{ value: 'b', label: __( 'Option B' ) },
							{ value: 'c', label: __( 'Option C' ) },
						] }
						onChange={ ( newSelect ) => setSelect( newSelect ) }
					/>
					<Button variant="primary">
						{ __( 'Primary Button' ) }{ ' ' }
					</Button>
				</PanelBody>
			</PluginSidebar>
		</>
	);
};

registerPlugin( 'plugin-sidebar-more-menu-item-example', {
	render: PluginSidebarMoreMenuItemTest,
} );
```

## Location

![Interaction](https://developer.wordpress.org/files/2024/08/pluginsidebar-more-menu-item-1.gif)
