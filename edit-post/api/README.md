Edit post API
====

The edit post API contains the following methods:

### `wp.editPost.registerSidebar( name: string, settings: { title: string, render: function } )`

This method takes two arguments: 
- a `name` to identify the sidebar. This name should contain a namespace prefix, followed by a slash and a sidebar name. The name should include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-sidebar.
- a `settings` object, containing a title and a render function. 

This method only registers a sidebar. To open the sidebar, use the `activateSidebar` method below.

#### Example:

```js
wp.editPost.registerSidebar( 'my-plugin/my-custom-sidebar', {
	render: function mySidebar() {
		return <p>This is an example</p>;
	},
} );
```

### `wp.editPost.activateSidebar( name: string )`

This method takes one argument: 
- the `name` of the sidebar you'd like to open. That sidebar should have been registered beforehand using the `registerSidebar` method.

#### Example:

```js
wp.editPost.activateSidebar( 'my-plugin/my-custom-sidebar' );
```
