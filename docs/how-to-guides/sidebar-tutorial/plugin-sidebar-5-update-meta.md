# Update the Meta Field When the Input's Content Changes

The last step in the journey is to update the meta field when the input content changes. To do that, you'll use another utility from the `@wordpress/data` package, [useDispatch](/packages/data/README.md#usedispatch). These utilities are also known as _hooks_.

The `useDispatch` takes store name as its only argument and returns methods that you can use to update the store.

```js
( function ( wp ) {
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var useSelect = wp.data.useSelect;
	var useDispatch = wp.data.useDispatch;

	var MetaBlockField = function ( props ) {
		var metaFieldValue = useSelect( function ( select ) {
			return select( 'core/editor' ).getEditedPostAttribute( 'meta' )[ 'sidebar_plugin_meta_block_field' ];
		}, [] );

		var editPost = useDispatch( 'core/editor' ).editPost;

		return el( Text, {
			label: 'Meta Block Field',
			value: metaFieldValue,
			onChange: function ( content ) {
				editPost( {
					meta: { sidebar_plugin_meta_block_field: content },
				} );
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

Here's how it changed from the previous section:

-   The component now use `editPost` function returned by `useDispatch` hook. These functions are also known as _actions_.
-   By calling `editPost` every time the user types something within the input control, we're effectively updating the editor store on each key stroke.

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
