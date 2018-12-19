# Tweak the sidebar style and add controls

After the sidebar is up and running, we can focus on filling it up with the necessary components and basic styling. To visualize and edit the meta field value we'll use a input component. The [`wp.components` package](https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/packages-components/) contains many components available for us to reuse, and, specifically, the [`TextControl`](https://wordpress.org/gutenberg/handbook/designers-developers/developers/components/text-control/) let us create a input field, so that's what we'll use:

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

We've done a few things here:

* Substituted the raw _Meta field_ text with a TextControl component wrapped within a `div` element.
* Added the class `sidebar-plugin-content` to the `div` element so we can style it.
* Added a few dependencies to our JavaScript code here, namely the `wp-element` and `wp-components` packages, which we need to register in the PHP file.

We'll use the new CSS class available to us to give the sidebar a bit of breath. Create a new file in your plugin directory called `sidebar-plugin.css` with the following contents:

```css
.sidebar-plugin-content {
	padding: 16px;
}
```

We have now to tell WordPress to enqueue the new CSS stylesheet, for which we use the [`enqueue_block_editor_assets`](https://developer.wordpress.org/reference/hooks/enqueue_block_editor_assets/) that will take care of loading the stylesheet both in the editor and front-end.

After those changes, our plugin's PHP code looks like this:

```php
<?php

/*
Plugin Name: Sidebar example
*/

function sidebar_plugin_register() {
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

Reload the editor and open the sidebar. It should look like this:

![Sidebar with style and controls](./sidebar-style-controls.png)

We are almost there! This still doesn't work, though, we need to connect the input control to the meta block field.