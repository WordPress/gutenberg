Edit post API
====

The edit post API contains the following methods:

## `wp.editPost.registerPlugin( { name: string, render: function } )`

This method takes one argument: 
- An object containing the following data:
  - `name`: A string identifying the plugin. Must be unique across all registered plugins.
  - `render`: A component containing the UI elements to be rendered. See the list below for all available UI elements.
  
### Example

```js
const Fragment = wp.element.Fragment;
const PluginSidebar = wp.editPost.PluginSidebar;

const Component = () => (
	<Fragment>
        <PluginSidebar name="first-sidebar-name" title="My Sidebar">
            <h1>Content of the first sidebar</h1>
        </PluginSidebar>
        <PluginSidebar name="second-sidebar-name" title="My Second Sidebar">
            <h1>Content of the second sidebar</h1>
        </PluginSidebar>
	</Fragment>
);

wp.editPost.registerPlugin( {
    name: 'plugin-name',
    render: Component,
} );
```

You can activate the sidebars using the following lines:

`wp.data.dispatch( 'core/edit-post' ).openGeneralSidebar( 'plugin-name/first-sidebar-name' );`
`wp.data.dispatch( 'core/edit-post' ).openGeneralSidebar( 'plugin-name/second-sidebar-name' );`

  
### Available UI components

The available UI components are available under `wp.editPost`, and are React components.

#### PluginSidebar

Renders a sidebar when activated.

`<PluginSidebar name="sidebar-name" title="Sidebar title">{ contents }</PluginSidebar>`

- Props
  - `name`: A string identifying the sidebar. Must be unique for every sidebar registered iwthin the scope of your plugin.
  - `title`: Title displayed at the top of the sidebar. Must be a string.
  
The contents you render within the `PluginSidebar` will show up as content within the sidebar.

The sidebar can be activated using the data api:

`wp.data.dispatch( 'core/edit-post' ).openGeneralSidebar( 'plugin-name/sidebar-name' );`

Notice that you need to use both the plugin name and sidebar name separated by a `/` to show the correct sidebar.
