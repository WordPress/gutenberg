# Update the meta field when the input's content changes

The last step in the journey is to update the meta field when the input content changes. To do that, you'll use another utility from the `@wordpress/data` package, [withDispatch](../../../../../docs/designers-developers/developers/packages/packages-data/#withdispatch-mapdispatchtoprops-function-function).

`withDispatch` works similarly to `withSelect`. It takes two functions, the first returns an object with data, and the second takes that data object as input and returns a new UI component. Let's see how to use it:

```js
( function( wp ) {
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var withSelect = wp.data.withSelect;
	var withDispatch = wp.data.withDispatch;

	var mapSelectToProps = function( select ) {
		return {
			metaFieldValue: select( 'core/editor' )
				.getEditedPostAttribute( 'meta' )
				[ 'sidebar_plugin_meta_block_field' ],
		}
	}

	var mapDispatchToProps = function( dispatch ) {
		return {
			setMetaFieldValue: function( value ) {
				dispatch( 'core/editor' ).editPost(
					{ meta: { sidebar_plugin_meta_block_field: value } }
				);
			}
		}
	}

	var MetaBlockField = function( props ) {
		return el( Text, {
			label: 'Meta Block Field',
			value: props.metaFieldValue,
			onChange: function( content ) {
				props.setMetaFieldValue( content );
			},
		} );
	}

	var MetaBlockFieldWithData = withSelect( mapSelectToProps )( MetaBlockField );
	var MetaBlockFieldWithDataAndActions = withDispatch( mapDispatchToProps )( MetaBlockFieldWithData );

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
					el( MetaBlockFieldWithDataAndActions )
				)
			);
		}
	} );
} )( window.wp );
```

Here's how it changed from the previous section:

* Added a new `mapDispatchToProps` function that will be passed to `withDispatch`. It takes `dispatch` as input and returns an object containing functions to update the internal data structures of the editor. These functions are also known as _actions_.
* By calling `setMetaFieldValue` every time the user types something within the input control, we're effectively updating the editor store on each key stroke.
* The `props` argument to the `MetaBlockField` component contains now the data passed by `mapSelectToProps` and the actions passed by `mapDispatchToProps`.

Copy this new code to the JavaScript file, load the sidebar and see how the input value gets updated as you type. You may want to check that the internal data structures are updated as well. Type something in the input control, and execute the following instruction in your browser's console:

```js
wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )[
	'sidebar_plugin_meta_block_field'
];
```

The message displayed should be what you typed in the input.

Now, after doing some changes, hit the "Save draft" button or publish the post. Then, reload the editor page. The browser has now new content, fresh from the database. You want to confirm that what you typed was stored properly in the database, and has been reloaded in the current post data structure. Open the sidebar and make sure the input control is initialized with the last value you typed.

One last check. At this point, because you haven't edited the input yet, the current post and the edited attributes should be the same. Confirm that by executing this code in your browser's console:

```js
wp.data.select( 'core/editor' ).getCurrentPost()[ 'meta' ][
	'sidebar_plugin_meta_block_field'
];
wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )[
	'sidebar_plugin_meta_block_field'
];
```

This is it! You now have a custom sidebar that updates `post_meta` contents.
