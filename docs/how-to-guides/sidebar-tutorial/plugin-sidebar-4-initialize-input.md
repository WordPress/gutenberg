# Initialize the Input Control

Now that the field is available in the editor store, it can be surfaced to the UI. The first step will be to extract the input control to a separate function so you can expand its functionality while the code stays clear.

```js
( function ( wp ) {
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;

	var MetaBlockField = function () {
		return el( Text, {
			label: 'Meta Block Field',
			value: 'Initial value',
			onChange: function ( content ) {
				console.log( 'content changed to ', content );
			},
		} );
	};

	registerPlugin( 'my-plugin-sidebar', {
		render: function () {
			return el(
				PluginSidebar,
				{
					name: 'my-plugin-sidebar',
					icon: 'admin-post',
					title: 'My plugin sidebar',
				},
				el(
					'div',
					{ className: 'plugin-sidebar-content' },
					el( MetaBlockField )
				)
			);
		},
	} );
} )( window.wp );
```

Now you can focus solely on the `MetaBlockField` component. The goal is to initialize it with the value of `sidebar_plugin_meta_block_field`, but also to keep it updated when that value changes.

WordPress has [some utilities to work with data](/packages/data/README.md) from the stores. The first you're going to use is [useSelect](/packages/data/README.md#useselect).

The `useSelect` is used to fetch data for the current component and update it when the original data changes. Let's update the code to use it:

```js
( function ( wp ) {
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var useSelect = wp.data.useSelect;

	var MetaBlockField = function () {
		var metaFieldValue = useSelect( function ( select ) {
			return select( 'core/editor' ).getEditedPostAttribute( 'meta' )[ 'sidebar_plugin_meta_block_field' ];
		}, [] );

		return el( Text, {
			label: 'Meta Block Field',
			value: metaFieldValue,
			onChange: function ( content ) {
				console.log( 'content has changed to ', content );
			},
		} );
	};

	registerPlugin( 'my-plugin-sidebar', {
		render: function () {
			return el(
				PluginSidebar,
				{
					name: 'my-plugin-sidebar',
					icon: 'admin-post',
					title: 'My plugin sidebar',
				},
				el(
					'div',
					{ className: 'plugin-sidebar-content' },
					el( MetaBlockField )
				)
			);
		},
	} );
} )( window.wp );
```

Copy this code to the JavaScript file. Note that it now uses the `wp.data.useSelect` utility to be found in the `@wordpress/data` package. Go ahead and add `wp-data` as a dependency in the PHP script.

This is how the code changes from the previous section:

-   The `MetaBlockField` component will be updated every time the original data changes.
-   [getEditedPostAttribute](/docs/reference-guides/data/data-core-editor.md#geteditedpostattribute) is used to retrieve data instead of [getCurrentPost](/docs/reference-guides/data/data-core-editor.md#getcurrentpost) because it returns the most recent values of the post, including user editions that haven't been yet saved.

Update the code and open the sidebar. The input's content is no longer `Initial value` but a void string. Users can't type values yet, but let's check that the component is updated if the value in the store changes. Open the browser's console, execute

```js
wp.data
	.dispatch( 'core/editor' )
	.editPost( { meta: { sidebar_plugin_meta_block_field: 'hello world!' } } );
```

and observe how the contents of the input component change!
