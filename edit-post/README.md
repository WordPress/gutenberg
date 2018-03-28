## Extending the post editor UI

Extending the editor UI can be accomplished with the `registerPlugin` API, allowing you to define all your plugin's UI elements in one place.

Refer to [the plugins module documentation](../plugins/) for more information.

## Plugin Components

The following components can be used with the `registerPlugin` ([see documentation](../plugins)) API.
They can be found in the global variable `wp.editPost` when defining `wp-edit-post` as a script dependency.

Experimental components can be found under `wp.editPost.__experimental`. Experimental components are still being evaluated and can change in a future version.

### PluginSidebar (Experimental)

Renders a sidebar when activated. The contents within the `PluginSidebar` will appear as content within the sidebar.

If you wish to display the sidebar, you can with use the `PluginMoreMenuItem` component or the `wp.data.dispatch` API.

#### Usage

```jsx
<PluginSidebar name="sidebar-name" title="Sidebar title">
	<MySidebar />
</PluginSidebar>
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


### PluginMoreMenuItem (Experimental)

Renders a menu item in the more menu drop down, and can be used to activate other plugin UI components.
The text within the component appears as the menu item label.

#### Usage

```jsx
<PluginMoreMenuItem
	name="my-plugin"
	icon={ <wp.components.DashIcon name="yes" /> }
	type="sidebar"
	target="my-sidebar">
	My Sidebar
</PluginMoreMenuItem>
```

#### Props

##### name

A string identifying the menu item. Must be unique for every menu item registered within the scope of your plugin.

- Type: `String`
- Required: Yes

##### type

A string identifying the type of UI element you wish this menu item to activate. Can be: `sidebar`.

- Type: `String`
- Required: Yes

##### target

A string identifying the UI element you wish to be activated by this menu item. Must be the same as the `name` prop you have given to that UI element.

- Type: `String`
- Required: Yes

##### icon

An SVG React element to be rendered to the left of the menu item label.

- Type: `Element`
- Required: No


