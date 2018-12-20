# Tweak the sidebar style and add controls

After the sidebar is up and running, the next step is to fill it up with the necessary components and basic styling.

To visualize and edit the meta field value you'll use an input component. The `@wordpress/components` package contains many components available for you to reuse, and, specifically, the [TextControl](https://wordpress.org/gutenberg/handbook/designers-developers/developers/components/text-control/) is aimed at creating an input field:

```js
( function( wp ) {
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;

	registerPlugin( 'my-plugin-sidebar', {
		render: function() {
			return el( PluginSidebar,
				{
					name: 'my-plugin-sidebar',
					icon: 'admin-post',
					title: 'My plugin sidebar',
				},
				el( 'div',
					{ className: 'sidebar-plugin-content' },
					el( Text, {
						label: 'Meta Block Field',
						value: 'Initial value',
						onChange: function( content ) {
							console.log( 'content changed to ', content );
						},
					} )
				)
			);
		}
	} );
} )( window.wp );
```

Update the `sidebar-plugin.js` with this new code. Notice that it uses a new utility called `wp.components` from the `@wordpress/components` package. Go ahead and add it as `wp-components` in the PHP dependencies array.

It introduces a few changes from the previous section:

* Added the CSS class `sidebar-plugin-content` to the `div` element to be able to add some styles.
* Substituted the raw _Meta field_ text with a `TextControl` component wrapped within the `div` element.

With the new CSS class available you can now give the sidebar a bit of breath. Create a new file in your plugin directory called `sidebar-plugin.css` with the following contents:

```css
.sidebar-plugin-content {
	padding: 16px;
}
```

For WordPress to load this stylesheet in the editor and front-end, you need to tell it to enqueue it by using the [enqueue_block_editor_assets](https://developer.wordpress.org/reference/hooks/enqueue_block_editor_assets/) action hook.

After those changes, the PHP code should look like this:

```php
<?php

/*
Plugin Name: Sidebar example
*/

function sidebar_plugin_register() {
	wp_register_script(
		'sidebar-plugin-js',
		plugins_url( 'sidebar-plugin.js', __FILE__ ),
		array(
			'wp-plugins',
			'wp-edit-post',
			'wp-element',
			'wp-components'
		)
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

Reload the editor and open the sidebar:

![Sidebar with style and controls](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/sidebar-style-and-controls.png)

With the input control and the styling the sidebar looks nicer. This code doesn't let users to store or retrieve data just yet, so the next steps will focus on how to connect it to the meta block field.
