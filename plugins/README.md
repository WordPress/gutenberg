Plugins API
====

The plugins API contains the following methods:

### `wp.plugins.registerPlugin( name: string, settings: Object )`

This method takes two arguments:

1. `name`: A string identifying the plugin. Must be unique across all registered plugins.
2. `settings`: An object containing the following data:
   - `render`: A component containing the UI elements to be rendered. See the list below for all available UI elements.

**Example**

```jsx
const { Fragment } = wp.element;
const { PluginSidebar } = wp.editPost.__experimental;
const { registerPlugin } = wp.plugins;

const Component = () => (
	<Fragment>
		<PluginSidebar name="first-sidebar-name" title="My Sidebar">
			Content of the first sidebar
		</PluginSidebar>
		<PluginSidebar name="second-sidebar-name" title="My Second Sidebar">
			Content of the second sidebar
		</PluginSidebar>
	</Fragment>
);

registerPlugin( 'plugin-name', {
	render: Component,
} );
```

You can activate the sidebars using the following lines:

```js
wp.data.dispatch( 'core/edit-post' ).openGeneralSidebar( 'plugin-name/first-sidebar-name' );
wp.data.dispatch( 'core/edit-post' ).openGeneralSidebar( 'plugin-name/second-sidebar-name' );
```

### Components

The following components are found in the global variable `wp.plugins` when defining `wp-plugins` as a script dependency.

#### PluginSidebar

Renders a sidebar when activated. The contents within the `PluginSidebar` will appear as content within the sidebar.

```jsx
<PluginSidebar name="sidebar-name" title="Sidebar title">
		<MySidebar />
</PluginSidebar>
```

`PluginSidebar` accepts the following props:

- `name`: A string identifying the sidebar. Must be unique for every sidebar registered within the scope of your plugin.
- `title`: Title displayed at the top of the sidebar. Must be a string.
