# Get a sidebar up and running

This is going to be the first step in the journey: to tell the editor that there is a new plugin that will have its own sidebar. You can do so by using the [registerPlugin](https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/packages-plugins/) and [PluginSidebar](https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/packages-edit-post/#pluginsidebar) utilities provided by WordPress, to be found in the `@wordpress/plugins` and `@wordpress/edit-post` [packages](https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/), respectively.

Add the following code to a JavaScript file called `sidebar-plugin.js` and save it within your plugin's directory:

```js
( function( wp ) {
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;

	registerPlugin( 'my-plugin-sidebar', {
		render: function() {
			return PluginSidebar( {
				name: 'my-plugin-sidebar',
				icon: 'admin-post',
				title: 'My plugin sidebar',
				children: 'Meta field',
			} );
		},
	} );
} )( window.wp );
```

For this code to work, those utilities need to be available in the browser, so you tell WordPress to enqueue the packages that include them by introducing `wp-plugins` and `wp-edit-post` as dependencies of your script.

Copy this code to a PHP file within your plugin's directory:

```php
<?php

/*
Plugin Name: Sidebar plugin
*/

function sidebar_plugin_register() {
	wp_register_script(
		'sidebar-plugin-js',
		plugins_url( 'sidebar-plugin.js', __FILE__ ),
		array( 'wp-plugins', 'wp-edit-post' )
	);
}
add_action( 'init', 'sidebar_plugin_register' );

function sidebar_plugin_script_enqueue() {
	wp_enqueue_script( 'sidebar-plugin-js' );
}
add_action( 'enqueue_block_editor_assets', 'sidebar_plugin_script_enqueue' );
```

After installing and activating this plugin, there is a new icon resembling a tack in the top-right of the editor. Upon clicking it, the plugin's sidebar will be opened:

![Sidebar Up and Running](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/sidebar-up-and-running.png)
