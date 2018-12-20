# Update the meta field when the input's content changes

The last step in the journey is to update the meta field when the input content changes. To do that, you'll use another utility from the `@wordpress/data` package, [withDispatch](https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/packages-data/#withdispatch-mapdispatchtoprops-function-function).

`withDispatch` works similarly to `withSelect`. It takes two functions, the first returns an object with data, and the second takes that data object as input and returns a new UI component. Let's see how to use it:

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var withSelect = wp.data.withSelect;
	var withDispatch = wp.data.withDispatch;

	// Function that takes `select` as input
	// and returns an object containing data.
	var selectToData = function( select ) {
		return {
			metaFieldValue: select( 'core/editor' )
				.getEditedPostAttribute( 'meta' )
				[ 'sidebar_plugin_meta_block_field' ],
		}
	}

	// Function that takes `dispatch` as input
	// and returns an object containing functions
	// to update the internal data structures.
	// These functions are also known as actions.
	var dispatchToActions = function( dispatch ) {
		return {
			setMetaFieldValue: function( value ) {
				dispatch( 'core/editor' ).editPost(
					{ meta: { sidebar_plugin_meta_block_field: value } }
				);
			}
		}
	}

	// Function that takes an object called `props` as input
	// and outputs a component.
	//
	// Note that the `props` argument now contains:
	// 1) the data passed by `selectToData`
	// 2) the functions passed by `dispatchToActions`
	var MetaBlockField = function( props ) {
		return el( Text, {
			label: 'Meta Block Field',
			value: props.metaFieldValue,
			onChange: function( content ) {
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

Copy this new code to the JavaScript file, load the sidebar and see how the input value gets updated as you type.

Now that this is in place, you may want to check that the internal data structures are updated after the input's content is changed. Type something in the input control, and execute the following instruction in your browser's console:

```js
wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )[
	'sidebar_plugin_meta_block_field'
];
```

The message displayed should be what you typed in the input. Now, after doing some changes, hit the "Save draft" button (or publish the post). Then, reload the editor page. The browser has now new content, fresh from the database. You want to confirm that what you typed was stored properly in the database, the current post data. Open the sidebar and make sure it is initialized with the last value you typed.

At this point, because you haven't yet edited the input, the current post and the edited attributes should be the same. Confirm that by executing this code in your browser's console:

```js
wp.data.select( 'core/editor' ).getCurrentPost()[ 'meta' ][
	'sidebar_plugin_meta_block_field'
];
wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )[
	'sidebar_plugin_meta_block_field'
];
```

This is it! You now have a custom sidebar that updates `post_meta` contents.
