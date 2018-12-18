# Connect the input component to the meta field

```php
<?php

/*
Plugin Name: Sidebar example
*/

function sidebar_plugin_register() {
	register_meta( 'post', 'sidebar_plugin_meta_block_field', array(
		'show_in_rest' => true,
		'single' => true,
		'type' => 'string',
	) );
	wp_register_script(
		'sidebar-plugin-js',
		plugins_url( 'sidebar-plugin.js', __FILE__ ),
		array( 'wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components', 'wp-data' )
	);
	wp_register_style(
		'sidebar-plugin-css',
		plugins_url( 'sidebar-plugin.css', __FILE__ )
	);
}
add_action( 'init', 'sidebar_plugin_register' );

function sidebar_plugin_script_enqueue() {
	wp_enqueue_script( 'sidebar-plugin-js' );
}
add_action( 'enqueue_block_editor_assets', 'sidebar_plugin_script_enqueue' );

function sidebar_plugin_style_enqueue() {
	wp_enqueue_style( 'sidebar-plugin-css' );
}
add_action( 'enqueue_block_assets', 'sidebar_plugin_style_enqueue' );
```

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var compose = wp.compose.compose;
	var withSelect = wp.data.withSelect;
	var withDispatch = wp.data.withDispatch;

	var MetaBlockField = compose(
		withSelect( function( select, props ) {
			return {
				metaFieldValue: select( 'core/editor' ).getEditedPostAttribute( 'meta' )[ props.fieldName ]
			}
		} ),
		withDispatch( function( dispatch, props ) {
			return {
				setMetaFieldValue: function( fieldValue ) {
					dispatch( 'core/editor' ).editPost( { meta: { [ props.fieldName ]: fieldValue } } );
				}
			}
		} )
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
				icon: 'admin-post',
				name: 'my-plugin-sidebar',
				title: 'My plugin sidebar',
				children: el(
					'div',
					{ className: 'sidebar-plugin-content' },
					el( MetaBlockField, { fieldName: 'sidebar_plugin_meta_block_field' } )
				),
			} );
		}
	} );
} )( window.wp );
```