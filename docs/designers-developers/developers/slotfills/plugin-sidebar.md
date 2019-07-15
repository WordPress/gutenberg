# PluginSidebar

This slot allows for adding items into the Gutenberg Toolbar.
Using this slot will add an icon to the bar that, when clicked, will open a sidebar with the content of the items wrapped in the `<PluginSidebar />` component.

## Example

```js
const { registerPlugin } = wp.plugins;
const { PluginSidebar } = wp.editPost;

const PluginSidebarTest = () => {
	return(
		<PluginSidebar
			name='plugin-sidebar-test'
			title='My Plugin'
			icon="smiley"
		>
			<p>Plugin Sidebar</p>
		</PluginSidebar>
	)
}
registerPlugin( 'plugin-sidebar-test', { render: PluginSidebarTest } );

```

## Location

### Closed State

![Closed State](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/plugin-sidebar-closed-state.png?raw=true)

### Open State

![Open State](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers//assets/plugin-sidebar-open-state.png?raw=true)
