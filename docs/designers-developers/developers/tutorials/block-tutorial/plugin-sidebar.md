# Creating a sidebar for your plugin

```php
<?php

/*
Plugin Name: Sidebar plugin
*/

function sidebar_plugin_script_register() {
	wp_register_script(
		'sidebar-plugin-js',
		plugins_url( 'sidebar-plugin.js', __FILE__ ),
		array( 'wp-plugins', 'wp-edit-post', 'wp-element' )
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

```js
( function( wp ) {
	var el = wp.element.createElement;
	wp.plugins.registerPlugin( 'my-plugin-sidebar', {
		render: function(){
			return wp.editPost.PluginSidebar( {
				icon: 'admin-post',
				name: 'my-plugin-sidebar',
				title: 'My plugin sidebar',
				children: el(
					'div',
					{ className: 'sidebar-plugin-content' },
					'Meta field',
				),
			} );
		},
	} );
} )( window.wp );
```

```css
.sidebar-plugin-content {
	padding: 16px;
}
```
