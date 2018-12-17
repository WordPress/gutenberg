# Creating a sidebar for your plugin

```php
<?php

/*
Plugin Name: My plugin sidebar
*/
function sidebar_plugin_script_register() {
	wp_register_script(
		'sidebar-plugin-block',
		plugins_url( 'sidebar-plugin.js', __FILE__ ),
		array( 'wp-plugins', 'wp-edit-post' )
	);
}
add_action( 'init', 'sidebar_plugin_script_register' );

function sidebar_plugin_script_enqueue() {
	wp_enqueue_script( 'sidebar-plugin-block' );
}
add_action( 'enqueue_block_editor_assets', 'sidebar_plugin_script_enqueue' );
```

```js
( function( wp ) {
    wp.plugins.registerPlugin( 'my-plugin-sidebar', {
        render: function(){
            return wp.editPost.PluginSidebar( {
                icon: 'admin-post',
                name: 'my-plugin-sidebar',
                title: 'My plugin sidebar',
                children: "Plugin sidebar's content",
            } );
        },
    } );
} )( window.wp );
```