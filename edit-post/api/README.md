Edit post API
====

The edit post API contains the following methods:

### `wp.editPost.__experimental.registerPlugin( { name: string, render: function } )`

This method takes one argument: 
- An object containing the following data:
  - `name`: A string identifying the plugin. Must be unique across all registered plugins.
  - `render`: A component containing the UI elements to be rendered. See the list below for all available UI elements.
  
**Example**

```js
const Fragment = wp.element.Fragment;
const PluginSidebar = wp.editPost.__experimental.PluginSidebar;

const Component = () => (
	<Fragment>
        <PluginSidebar name="first-sidebar-name" title="My Sidebar">
            <p>Content of the first sidebar</p>
        </PluginSidebar>
        <PluginSidebar name="second-sidebar-name" title="My Second Sidebar">
            <p>Content of the second sidebar</p>
        </PluginSidebar>
	</Fragment>
);

wp.editPost.__experimental.registerPlugin( {
    name: 'plugin-name',
    render: Component,
} );
```

You can activate the sidebars using the following lines:

```js
wp.data.dispatch( 'core/edit-post' ).openGeneralSidebar( 'plugin-name/first-sidebar-name' );
wp.data.dispatch( 'core/edit-post' ).openGeneralSidebar( 'plugin-name/second-sidebar-name' );
```
  
### Available UI components

The available UI components are found in the global variable `wp.editPost.__experimental`, and are React components.

#### PluginSidebar

Renders a sidebar when activated.
```js
<PluginSidebar name="sidebar-name" title="Sidebar title">
    <MySidebar />
</PluginSidebar>
```
- Props
  - `name`: A string identifying the sidebar. Must be unique for every sidebar registered within the scope of your plugin.
  - `title`: Title displayed at the top of the sidebar. Must be a string.
  
The contents you render within the `PluginSidebar` will show up as content within the sidebar.
