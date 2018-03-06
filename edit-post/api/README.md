Edit post API
====

The edit post API contains the following methods:

### `wp.editPost.__experimentalRegisterSidebar( name: string, settings: { title: string, render: function } )`

**Warning:** This is an experimental API, and is subject to change or even removal.

This method takes two arguments: 
- a `name` to identify the sidebar. This name should contain a namespace prefix, followed by a slash and a sidebar name. The name should include only lowercase alphanumeric characters or dashes, and start with a letter. Example: `my-plugin/my-custom-sidebar`.
- a `settings` object, containing a title and a render function. 

This method only registers a sidebar. To open the sidebar, use the `__experimentalRegisterSidebar` method below.

#### Example:

```js
wp.editPost.__experimentalRegisterSidebar( 'my-plugin/my-custom-sidebar', {
	render: function mySidebar() {
		return <p>This is an example</p>;
	},
} );
```

### `wp.editPost.__experimentalActivateSidebar( name: string )`

**Warning:** This is an experimental API, and is subject to change or even removal.

This method takes one argument: 
- the `name` of the sidebar you'd like to open. That sidebar should have been registered beforehand using the `__experimentalRegisterSidebar` method.

#### Example:

```js
wp.editPost.__experimentalActivateSidebar( 'my-plugin/my-custom-sidebar' );
```
