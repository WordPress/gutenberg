Plugins API
====

The plugins API contains the following methods:

### `wp.plugins.registerPlugin( name: string, settings: Object )`

This method registers a new plugin.

This method takes two arguments:

1. `name`: A string identifying the plugin. Must be unique across all registered plugins.
2. `settings`: An object containing the following data:
   - `render`: A component containing the UI elements to be rendered.

See [the edit-post module documentation](../edit-post/) for available components.

**Example**

```jsx
const { Fragment } = wp.element;
const { PluginSidebar, PluginMoreMenuItem } = wp.editPost.__experimental;
const { registerPlugin } = wp.plugins;

const Component = () => (
	<Fragment>
		<PluginSidebar name="sidebar-name" title="My Sidebar">
			Content of the first sidebar
		</PluginSidebar>
		<PluginMoreMenuItem
			name="menu-item-name"
			title="My Second Sidebar"
			type="sidebar"
			target="isebar-name">
			My Sidebar
		</PluginMoreMenuItem>
	</Fragment>
);

registerPlugin( 'plugin-name', {
	render: Component,
} );
```

### `wp.plugins.unregisterPlugin( name: string )`

This method unregisters an existing plugin.

This method takes one argument:

1. `name`: A string identifying the plugin.
