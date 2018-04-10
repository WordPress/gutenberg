## Extending the post editor UI

Extending the editor UI can be accomplished with the `registerPlugin` API, allowing you to define all your plugin's UI elements in one place.

Refer to [the plugins module documentation](../plugins/) for more information.

## Plugin Components

The following components can be used with the `registerPlugin` ([see documentation](../plugins)) API.
They can be found in the global variable `wp.editPost` when defining `wp-edit-post` as a script dependency.

### `PluginSidebar`

Renders a sidebar when activated. The contents within the `PluginSidebar` will appear as content within the sidebar.

If you wish to display the sidebar, you can with use the [`SidebarMoreMenuItem`](#sidebarmoremenuitem) component or the `wp.data.dispatch` API:
```js
wp.data.dispatch( 'core/edit-post' ).openGeneralSidebar( 'plugin-name/sidebar-name' );
```

_Example:_

```jsx
const { PanelBody } = wp.components;
const { PluginSidebar } = wp.editPost;

const MyPluginSidebar = () => (
	<PluginSidebar
		name="sidebar-name"
		title="Sidebar title"
	>
		<PanelBody>
			My sidebar content
		</PanelBody>
	</PluginSidebar>
);
```

#### Props

##### name

A string identifying the sidebar. Must be unique for every sidebar registered within the scope of your plugin.

- Type: `String`
- Required: Yes

##### title

Title displayed at the top of the sidebar.

- Type: `String`
- Required: Yes


### `SidebarMoreMenuItem`

Renders a menu item in the `More Menu` drop down, and can be used to activate other plugin UI components.
The text within the component appears as the menu item label.

_Example:_

```jsx
const { SidebarMoreMenuItem } = wp.editPost;

const MySidebarMoreMenuItem = () => (
	<SidebarMoreMenuItem
		name="my-plugin"
		icon="yes"
		target="my-sidebar"
	>
		My Sidebar
	</SidebarMoreMenuItem>
);
```

#### Props

##### name

A string identifying the menu item. Must be unique for every menu item registered within the scope of your plugin.

- Type: `String`
- Required: Yes

##### target

A string identifying the UI element you wish to be activated by this menu item. Must be the same as the `name` prop you have given to that UI element.

- Type: `String`
- Required: Yes

##### icon

The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element, to be rendered to the left of the menu item label.

- Type: `String` | `Element`
- Required: No


### `PluginsMoreMenuGroup`

Renders all menu items passed as `children` inside the `Plugins` menu group in the `More Menu` drop down. 

_Example:_

```jsx
const { PluginsMoreMenuGroup } = wp.editPost;

const MyPluginsMoreMenuGroup = () => (
	<PluginsMoreMenuGroup>
		<MySidebarMoreMenuItem />
	</PluginsMoreMenuGroup>
);
```
