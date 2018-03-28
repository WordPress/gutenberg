## Plugin Components

The following components can be used with the `registerplugin` ([see documentation](../plugins)) API.
They can be found in the global variable `wp.editPost` when defining `wp-edit-post` as a script dependency.

### PluginSidebar

Renders a sidebar when activated. The contents within the `PluginSidebar` will appear as content within the sidebar.

```jsx
<PluginSidebar name="sidebar-name" title="Sidebar title">
		<MySidebar />
</PluginSidebar>
```

`PluginSidebar` accepts the following props:

- `name`: A string identifying the sidebar. Must be unique for every sidebar registered within the scope of your plugin.
- `title`: Title displayed at the top of the sidebar. Must be a string.

### PluginMoreMenuItem

Renders a menu item in the more menu drop down, and can be used to activate other plugin UI components.
The text within the component appears as the menu item label.

```jsx
<PluginMoreMenuItem
	name="my-plugin"
	icon={ <wp.components.DashIcon name="yes" /> }
	type="sidebar"
	target="my-sidebar">
	My Sidebar
</PluginMoreMenuItem>
```

`PluginMoreMenuItem` accepts the following props:

- `name`: A string identifying the menu item. Must be unique for every menu item registered within the scope of your plugin.
- `type`: A string identifying the type of UI element you wish this menu item to activate. Can be: `sidebar`.
- `target`: A string identifying the UI element you wish to be activated by this menu item. Must be the same as the `name` prop you have given to that UI element.
- `icon` (optional): An SVG react element to be rendered to the left of the menu item label.

