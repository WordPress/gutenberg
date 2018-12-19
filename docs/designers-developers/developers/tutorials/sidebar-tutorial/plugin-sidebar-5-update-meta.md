# Update the meta field when the input content changes

The last step in our journey is to update the meta field when the input content changes. To do that, we'll use another utility from the `@wordpress/data` package, [`withDispatch`](https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/packages-data/#withdispatch-mapdispatchtoprops-function-function).

`withDispatch` works like `withSelect`. Let's see how to use it:

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var withSelect = wp.data.withSelect;
	var withDispatch = wp.data.withDispatch;

	// Function that takes `select` as input and returns some data.
	var selectToData = function( select ) {
		return {
			metaFieldValue: select(
				'core/editor'
			).getEditedPostAttribute( 'meta' )[ 'sidebar_plugin_meta_block_field' ],
		}
	}

	// Function that takes `dispatch` as input and returns an object with functions.
	// We call these functions _actions_, and they'll update the internal data 
	// structures when executed.
	var dispatchToActions = function( dispatch ) {
		return {
			setMetaFieldValue: function( value ) {
				dispatch( 'core/editor' ).editPost( { meta: { sidebar_plugin_meta_block_field: value } } );
			}
		}
	}

	// Our original UI component.
	// The action functions will now be also available through the `props` argument.
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

With this code, we can now load our sidebar and see how the input value gets updated as we type. Check that the internal data structures are updated after some changes by executing the following code in your browser's console:

```js
wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )[ 'sidebar_plugin_meta_block_field' ];
```

After doing some changes, hit the "Save draft" button (or publish the post). Check that the changes are now stored properly in the current post data by doing:

```js
wp.data.select( 'core/editor' ).getCurrentPost()[ 'meta' ][ 'sidebar_plugin_meta_block_field' ];
```

That's it! We now have a custom sidebar to update `post_meta` content.
