# Tweak the sidebar style and add controls

After the sidebar is up and running, the next step is to fill it up with the necessary components and basic styling.

To visualize and edit the meta field value you'll use an input component. The `@wordpress/components` package contains many components available for you to reuse, and, specifically, the [TextControl](../../../../../docs/designers-developers/developers/components/text-control/) is aimed at creating an input field:

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
					{ className: 'plugin-sidebar-content' },
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

Update the `plugin-sidebar.js` with this new code. Notice that it uses a new utility called `wp.components` from the `@wordpress/components` package. Go ahead and add it as `wp-components` in the PHP dependencies array.

It introduces a few changes from the previous section:

* Added the CSS class `plugin-sidebar-content` to the `div` element to be able to add some styles.
* Substituted the raw _Meta field_ text with a `TextControl` component wrapped within the `div` element.

With the new CSS class available you can now give the sidebar a bit of breath. Create a new file in your plugin directory called `plugin-sidebar.css` with the following contents:

```css
.plugin-sidebar-content {
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
		'plugin-sidebar-js',
		plugins_url( 'plugin-sidebar.js', __FILE__ ),
		array(
			'wp-plugins',
			'wp-edit-post',
			'wp-element',
			'wp-components'
		)
	);
	wp_register_style(
		'plugin-sidebar-css',
		plugins_url( 'plugin-sidebar.css', __FILE__ )
	);
}
add_action( 'init', 'sidebar_plugin_register' );

function sidebar_plugin_script_enqueue() {
	wp_enqueue_script( 'plugin-sidebar-js' );
}
add_action( 'enqueue_block_editor_assets', 'sidebar_plugin_script_enqueue' );

function sidebar_plugin_style_enqueue() {
	wp_enqueue_style( 'plugin-sidebar-css' );
}
add_action( 'enqueue_block_assets', 'sidebar_plugin_style_enqueue' );
```

Reload the editor and open the sidebar:

![Sidebar with style and controls](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/sidebar-style-and-controls.png)

With the input control and the styling the sidebar looks nicer. This code doesn't let users to store or retrieve data just yet, so the next steps will focus on how to connect it to the meta block field.
