# PluginSidebarMoreMenuItem

This slot allows the creation of a `<PluginSidebar>` with a menu item that when clicked will expand the sidebar to the appropriate Plugin section.
This is done by setting the `target` on `<PluginSidebarMoreMenuItem>` to match the `name` on the `<PluginSidebar>`


## Example

```js
const { registerPlugin } = wp.plugins;

const {
	PluginSidebar,
	PluginSidebarMoreMenuItem
} = wp.editPost;

const { Fragment } = wp.element;

const PluginSidebarMoreMenuItemTest = () => (
	<Fragment>
		<PluginSidebarMoreMenuItem
		    target="sidebar-name"
		    icon="smiley"
		    >
			Expanded Sidebar - More item
		</PluginSidebarMoreMenuItem>
		<PluginSidebar
			name="sidebar-name"
			icon="smiley"
			title="My Sidebar" >
			Content of the sidebar
		</PluginSidebar>
	</Fragment>
)

registerPlugin( 'plugin-sidebar-expanded-test', { render: PluginSidebarMoreMenuItemTest } );
```

## Location

![Interaction](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/plugin-sidebar-more-menu-item.gif?raw=true)
