# Initialize the input control

Now that the field is available in the editor store, it can be surfaced to the UI. The first step will be to extract the input control to a separate function so you can expand its functionality while the code stays clear.

```js
( function( wp ) {
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;

	var MetaBlockField = function() {
		return el( Text, {
			label: 'Meta Block Field',
			value: 'Initial value',
			onChange: function( content ) {
				console.log( 'content changed to ', content );
			},
		} );
	}

	registerPlugin( 'my-plugin-sidebar', {
		render: function() {
			return el( PluginSidebar,
				{
					name: 'my-plugin-sidebar',
					icon: 'admin-post',
					title: 'My plugin sidebar',
				},
				el( 'div',
					{ className: 'plugin-sidebar-content' },
					el( MetaBlockField )
				)
			);
		}
	} );
} )( window.wp );
```

Now you can focus solely on the `MetaBlockField` component. The goal is to initialize it with the value of `sidebar_plugin_meta_block_field`, but also to keep it updated when that value changes.

WordPress has [some utilities to work with data](/packages/data/README.md) from the stores. The first you're going to use is [withSelect](/packages/data/README.md#withselect-mapselecttoprops-function-function), whose signature is:

```js
withSelect(
	// a function that takes `select` as input
	// and returns an object containing data
)(
	// a function that takes the previous data as input
	// and returns a component
);
```

`withSelect` is used to pass data to other components, and update them when the original data changes. Let's update the code to use it:

```js
( function( wp ) {
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var withSelect = wp.data.withSelect;

	var mapSelectToProps = function( select ) {
		return {
			metaFieldValue: select( 'core/editor' )
				.getEditedPostAttribute( 'meta' )
				[ 'sidebar_plugin_meta_block_field' ]
		}
	}

	var MetaBlockField = function( props ) {
		return el( Text, {
			label: 'Meta Block Field',
			value: props.metaFieldValue,
			onChange: function( content ) {
				console.log( 'content has changed to ', content );
			},
		} );
	}

	var MetaBlockFieldWithData = withSelect( mapSelectToProps )( MetaBlockField );

	registerPlugin( 'my-plugin-sidebar', {
		render: function() {
			return el( PluginSidebar,
				{
					name: 'my-plugin-sidebar',
					icon: 'admin-post',
					title: 'My plugin sidebar',
				},
				el( 'div',
					{ className: 'plugin-sidebar-content' },
					el( MetaBlockFieldWithData )
				)
			);
		}
	} );
} )( window.wp );
```

Copy this code to the JavaScript file. Note that it now uses the `wp.data.withSelect` utility to be found in the `@wordpress/data` package. Go ahead and add `wp-data` as a dependency in the PHP script.

This is how the code changes from the previous section:

* The `MetaBlockField` function has now a `props` argument as input. It contains the data object returned by the `mapSelectToProps` function, which it uses to initialize its value property.
* The component rendered within the `div` element was also updated, the plugin now uses `MetaBlockFieldWithData`. This will be updated every time the original data changes.
* [getEditedPostAttribute](/docs/designers-developers/developers/data/data-core-editor.md#geteditedpostattribute) is used to retrieve data instead of [getCurrentPost](/docs/designers-developers/developers/data/data-core-editor.md#getcurrentpost) because it returns the most recent values of the post, including user editions that haven't been yet saved.

Update the code and open the sidebar. The input's content is no longer `Initial value` but a void string. Users can't type values yet, but let's check that the component is updated if the value in the store changes. Open the browser's console, execute

```js
wp.data.dispatch( 'core/editor' ).editPost(
	{ meta: { sidebar_plugin_meta_block_field: 'hello world!' } }
);
```

and observe how the contents of the input component change!
