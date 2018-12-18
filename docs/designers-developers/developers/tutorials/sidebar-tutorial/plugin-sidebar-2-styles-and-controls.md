# Tweak the sidebar style and add controls

After the sidebar is up and running, we can focus on filling it up with the necessary components and basic styling. To visualize and edit the meta field value we'll use a input component. The `wp.components` package contains many components available for us to reuse, and, specifically, the `TextControl` let us create a input field, so that what we'll use:

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;

	wp.plugins.registerPlugin( 'my-plugin-sidebar', {
		render: function(){
			return wp.editPost.PluginSidebar( {
				name: 'my-plugin-sidebar',
				icon: 'admin-post',
				title: 'My plugin sidebar',
				children: el(
					'div',
					{ className: 'sidebar-plugin-content' },
					el( Text, {
						label: 'Meta Block Field',
						value: 'Initial value',
						onChange: function( content ) {
							console.log( 'content changed to ', content );
						},
					} )
				),
			} );
		}
	} );
} )( window.wp );
```

Within the sidebar body, we have created a `<div>` element wich coontains the `TextControl` component. The `<div>` has a class attribute with value equals to `sidebar-plugin-content` so we can style.

```php
<?php

/*
Plugin Name: Sidebar example
*/

function sidebar_plugin_script_register() {
	wp_register_script(
		'sidebar-plugin-js',
		plugins_url( 'sidebar-plugin.js', __FILE__ ),
		array( 'wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components' )
	);
	wp_register_style(
		'sidebar-plugin-css',
		plugins_url( 'sidebar-plugin.css', __FILE__ )
	);

}
add_action( 'init', 'sidebar_plugin_script_register' );

function sidebar_plugin_script_enqueue() {
	wp_enqueue_script( 'sidebar-plugin-js' );
}
add_action( 'enqueue_block_editor_assets', 'sidebar_plugin_script_enqueue' );

function sidebar_plugin_style_enqueue() {
	wp_enqueue_style( 'sidebar-plugin-css' );
}
add_action( 'enqueue_block_assets', 'sidebar_plugin_style_enqueue' );
```
