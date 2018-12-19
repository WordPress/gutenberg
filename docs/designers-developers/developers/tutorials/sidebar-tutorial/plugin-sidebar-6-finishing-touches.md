# Finishing touches

We have now JavaScript code that works as expected, so we can now focus on making our code more idiomatic.

The first step is to convert the functions `selectToData` and `dispatchToActions` to anonymous functions that get passed directly to `withSelect` and `withData`, respectively:

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var withSelect = wp.data.withSelect;
	var withDispatch = wp.data.withDispatch;

	var MetaBlockField = function( props ) {
		return el( Text, {
			label: 'Meta Block Field',
			value: props.metaFieldValue,
			onChange: ( content ) => {
				props.setMetaFieldValue( content );
			},
		} );
	}

	var MetaBlockFieldWithData = withSelect( function( select ) {
		return {
			metaFieldValue: select(
				'core/editor'
			).getEditedPostAttribute( 'meta' )[ 'sidebar_plugin_meta_block_field' ],
		}
	} )( MetaBlockField );

	var MetaBlockFieldWithDataAndActions = withDispatch( function( dispatch ) {
		return {
			setMetaFieldValue: function( value ) {
				dispatch(
					'core/editor'
				).editPost( { meta: { sidebar_plugin_meta_block_field: value } } );
			}
		}
	} )( MetaBlockFieldWithData );

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

Next, we want to merge `MetaBlockField`, `MetaBlockFieldWithData`, and `MetaBlockFieldWithDataAndActions` into one function called `MetaBlockField` that gets passed to the `div` element. The `@wordpress/compose` package offers an utility to concatenate functions called `compose`. Don't forget adding `wp-compose` to the dependencies array in the PHP script.

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var withSelect = wp.data.withSelect;
	var withDispatch = wp.data.withDispatch;
	var compose = wp.compose.compose;

	var MetaBlockField = compose(
		withDispatch( function( dispatch ) {
			return {
				setMetaFieldValue: function( value ) {
					dispatch(
						'core/editor'
					).editPost( { meta: { sidebar_plugin_meta_block_field: value } } );
				}
			}
		} ),
		withSelect( function( select ) {
			return {
				metaFieldValue: select(
					'core/editor'
				).getEditedPostAttribute( 'meta' )[ 'sidebar_plugin_meta_block_field' ],
			}
		} ),
	)( function( props ) {
		return el( Text, {
			label: 'Meta Block Field',
			value: props.metaFieldValue,
			onChange: ( content ) => {
				props.setMetaFieldValue( content );
			},
		} );
	} );

	wp.plugins.registerPlugin( 'my-plugin-sidebar', {
		render: function(){
			return wp.editPost.PluginSidebar( {
				name: 'my-plugin-sidebar',
				icon: 'admin-post',
				title: 'My plugin sidebar',
				children: el(
					'div',
					{ className: 'sidebar-plugin-content' },
					el( MetaBlockField )
				),
			} );
		}
	} );
} )( window.wp );
```

Finally, we're going to extract the meta field name (`sidebar_plugin_meta_block_field`) from `withSelect` and `withDispatch` to have it declared in a single place, so it's easier to change in the future. We can leverage the fact that `withSelect` and `withDispatch` first functions can take the props of the UI component they wrap as a second argument. For example:

```js
// ...

var MetaBlockFieldWithData = withSelect(
	function( select, props ) {
		// We can access props.metaFieldName here!
	}
)( MetaBlockField );

// ...
	el(
		MetaBlockFieldWithData,
		{ metaFieldName: 'sidebar_plugin_meta_block_field' } // props passed to the component
	)
// ...
```

Let's change our code to take advantage of that:

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var withSelect = wp.data.withSelect;
	var withDispatch = wp.data.withDispatch;
	var compose = wp.compose.compose;

	var MetaBlockField = compose(
		withDispatch( function( dispatch, props ) {
			return {
				setMetaFieldValue: function( value ) {
					dispatch(
						'core/editor'
					).editPost( { meta: { [ props.fieldName ]: value } } );
				}
			}
		} ),
		withSelect( function( select, props ) {
			return {
				metaFieldValue: select(
					'core/editor'
				).getEditedPostAttribute( 'meta' )[ props.fieldName ],
			}
		} ),
	)( function( props ) {
		return el( Text, {
			label: 'Meta Block Field',
			value: props.metaFieldValue,
			onChange: ( content ) => {
				props.setMetaFieldValue( content );
			},
		} );
	} );

	wp.plugins.registerPlugin( 'my-plugin-sidebar', {
		render: function(){
			return wp.editPost.PluginSidebar( {
				name: 'my-plugin-sidebar',
				icon: 'admin-post',
				title: 'My plugin sidebar',
				children: el(
					'div',
					{ className: 'sidebar-plugin-content' },
					el(
						MetaBlockField,
						{ fieldName: 'sidebar_plugin_meta_block_field' }
					)
				),
			} );
		}
	} );
} )( window.wp );
```