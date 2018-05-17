# Plugins

### Plugins API

The plugins API contains the following methods:

#### `wp.plugins.registerPlugin( name: string, settings: Object )`

This method registers a new plugin.

This method takes two arguments:

1. `name`: A string identifying the plugin. Must be unique across all registered plugins.
2. `settings`: An object containing the following data:
    - `icon: string | WPElement | Function` - An icon to be shown in the UI. It can be a slug
      of the [Dashicon](https://developer.wordpress.org/resource/dashicons/#awards),
      or an element (or function returning an element) if you choose to render your own SVG.
    - `render`: A component containing the UI elements to be rendered.

See [the edit-post module documentation](../edit-post/) for available components.

_Example:_

```jsx
const { Fragment } = wp.element;
const { PluginSidebar, PluginSidebarMoreMenuItem } = wp.editPost;
const { registerPlugin } = wp.plugins;

const Component = () => (
	<Fragment>
		<PluginSidebarMoreMenuItem
			target="sidebar-name"
		>
			My Sidebar
		</PluginSidebarMoreMenuItem>
		<PluginSidebar
			name="sidebar-name"
			title="My Sidebar"
		>
			Content of the sidebar
		</PluginSidebar>
	</Fragment>
);

registerPlugin( 'plugin-name', {
	icon: 'smiley',
	render: Component,
} );
```

#### `wp.plugins.unregisterPlugin( name: string )`

This method unregisters an existing plugin.

This method takes one argument:

1. `name`: A string identifying the plugin.

_Example:_

```js
const { unregisterPlugin } = wp.plugins;

unregisterPlugin( 'plugin-name' );
```

### Components

#### `PluginArea`

A component that renders all registered plugins in a hidden div.

_Example:_

```jsx
const { PluginArea } = wp.plugins;

const Layout = () => (
	<div>
		Content of the page
		<PluginArea />
	</div>
);
```
