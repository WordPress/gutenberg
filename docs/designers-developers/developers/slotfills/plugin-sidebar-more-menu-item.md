# PluginSidebarMoreMenuItem

This slot allows the creation of a `<PluginSidebar>` with a menu item that when clicked will expand the sidebar to the appropriate Plugin section.
This is done by setting the `target` on `<PluginSidebarMoreMenuItem>` to match the `name` on the `<PluginSidebar>`

## Example

```js
import { registerPlugin } from '@wordpress/plugins';
import {
	PluginSidebar,
	PluginSidebarMoreMenuItem
} from '@wordpress/edit-post';
import { image } from '@wordpress/icons';

const { Fragment } = wp.element;
const myIcon =

const PluginSidebarMoreMenuItemTest = () => (
	<Fragment>
		<PluginSidebarMoreMenuItem
		    target="sidebar-name"
		    icon={ image }
		    >
			Expanded Sidebar - More item
		</PluginSidebarMoreMenuItem>
		<PluginSidebar
			name="sidebar-name"
			icon={ image }
			title="My Sidebar" >
			Content of the sidebar
		</PluginSidebar>
	</Fragment>
)

registerPlugin( 'plugin-sidebar-expanded-test', { render: PluginSidebarMoreMenuItemTest } );
```

## Location

![Interaction](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/plugin-sidebar-more-menu-item.gif?raw=true)
