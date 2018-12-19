# Update the meta field when the input content changes

The last step in our journey is to update the meta field when the input content changes. To do that, we'll use another utility from the `@wordpress/data` package, [`withDispatch`](https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/packages-data/#withdispatch-mapdispatchtoprops-function-function).

`withDispatch` works similar to `withSelect`. It takes two functions, the first that returns an object with data, and the second that takes that data as input and returns a new UI component. Let's see how to use it:

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var withSelect = wp.data.withSelect;
	var withDispatch = wp.data.withDispatch;

	// Function that takes `select` as input and returns some data.
	// This will be used by `withSelect`.
	var selectToData = function( select ) {
		return {
			metaFieldValue: select(
				'core/editor'
			).getEditedPostAttribute( 'meta' )[ 'sidebar_plugin_meta_block_field' ],
		}
	}

	// Function that takes `dispatch` as input and returns an object with functions.
	// We call these functions _actions_, and they serve to update
	// the internal data structures of the editor when executed.
	var dispatchToActions = function( dispatch ) {
		return {
			setMetaFieldValue: function( value ) {
				dispatch(
					'core/editor'
				).editPost( { meta: { sidebar_plugin_meta_block_field: value } } );
			}
		}
	}

	// Our original UI component. The `props` argument contains now both:
	// 1) the data passed by `selectToData`
	// 2) the actions passed by `dispatchToActions`
	var MetaBlockField = function( props ) {
		return el( Text, {
			label: 'Meta Block Field',
			value: props.metaFieldValue,
			onChange: ( content ) => {
				props.setMetaFieldValue( content );
			},
		} );
	}

	var MetaBlockFieldWithData = withSelect( selectToData )( MetaBlockField );
	var MetaBlockFieldWithDataAndActions = withDispatch( dispatchToActions )( MetaBlockFieldWithData );

	wp.plugins.registerPlugin( 'my-plugin-sidebar', {
		render: function(){
			return wp.editPost.PluginSidebar( {
				name: 'my-plugin-sidebar',
				icon: 'admin-post',
				title: 'My plugin sidebar',
				children: el(
					'div',
					{ className: 'sidebar-plugin-content' },
					el( MetaBlockFieldWithDataAndActions )
				),
			} );
		}
	} );
} )( window.wp );
```

With this code, we can now load our sidebar and see how the input value gets updated as we type. Update the plugin JavaScript code, reload the editor and make sure that it works.

Now that this is in place, we may want to check that the internal data structures are updated after the input's content is changed. Type something in the input control, and executing the following instruction in your browser's console:

```js
wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )[ 'sidebar_plugin_meta_block_field' ];
```

The message displayed should be what you typed in the input. Now, after doing some changes, hit the "Save draft" button (or publish the post). Then, reload the editor page. The browser has now new content, and we want to check if the changes we've saved were stored properly in the current post data. In your browser's console, execute:

```js
wp.data.select( 'core/editor' ).getCurrentPost()[ 'meta' ][ 'sidebar_plugin_meta_block_field' ];
```

The message displayed should be the same that you typed in the input control and the saved.

This is it! We now have a custom sidebar that updates `post_meta` contents.
