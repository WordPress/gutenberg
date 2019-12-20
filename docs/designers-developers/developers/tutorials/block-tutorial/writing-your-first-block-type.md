# Writing Your First Block Type

To keep things simple for our first example, let's create a new block type which displays a styled message in a post. At this point, we won't allow the user to edit the message. We'll learn more about editable fields in later sections.

Blocks containing static content are implemented entirely in JavaScript using the `registerBlockType` function. This function is responsible for specifying the blueprint of a block, describing the behaviors necessary for the editor to understand how it appears, changes when edited, and is ultimately saved in the post's content.

## Enqueuing Block Scripts

While the block's editor behaviors are implemented in JavaScript, you'll need to register your block server-side to ensure that the script is enqueued when the editor loads. Register scripts and styles using [`wp_register_script`](https://developer.wordpress.org/reference/functions/wp_register_script/) and [`wp_register_style`](https://developer.wordpress.org/reference/functions/wp_register_style/), then assign these as handles associated with your block using the `script`, `style`, `editor_script`, and `editor_style` block type registration settings. 

The `editor_script` and `editor_style` files will only be enqueued in the editor, while the `script` and `style` will be enqueued both in the editor and when viewing a post on the front of your site.

```php
<?php
/*
Plugin Name: Gutenberg examples 01
*/
function gutenberg_examples_01_register_block() {

	// automatically load dependencies and version
	$asset_file = include( plugin_dir_path( __FILE__ ) . 'build/index.asset.php');

	wp_register_script(
		'gutenberg-examples-01-esnext',
		plugins_url( 'build/block.js', __FILE__ ),
		$asset_file['dependencies'],
		$asset_file['version']
	);

	register_block_type( 'gutenberg-examples/example-01-basic-esnext', array(
		'editor_script' => 'gutenberg-examples-01-esnext',
	) );

}
add_action( 'init', 'gutenberg_examples_01_register_block' );
```

Note the above example, shows using the [wp-scripts build step](/docs/designers-developers/developers/tutorials/javascript/js-build-setup/) that automatically sets dependencies and versions the file. 

If you were using the ES5 code, you would specify `array( 'wp-blocks', 'wp-element' )` as the dependency array. See the [example 01](https://github.com/WordPress/gutenberg-examples/blob/master/01-basic/index.php) in Gutenberg Examples repository for full syntax.

- __`wp-blocks`__ includes block type registration and related functions
- __`wp-element`__ includes the [WordPress Element abstraction](/packages/element/README.md) for describing the structure of your blocks


## Registering the Block

With the script enqueued, let's look at the implementation of the block itself:

{% codetabs %}
{% ESNext %}
```jsx
import { registerBlockType } from '@wordpress/blocks';

const blockStyle = {
	backgroundColor: '#900',
	color: '#fff',
	padding: '20px',
};

registerBlockType( 'gutenberg-examples/example-01-basic-esnext', {
	title: 'Example: Basic (esnext)',
	icon: 'universal-access-alt',
	category: 'layout',
	example: {},
	edit() {
		return <div style={ blockStyle }>Hello World, step 1 (from the editor).</div>;
	},
	save() {
		return <div style={ blockStyle }>Hello World, step 1 (from the frontend).</div>;
	},
} );
```
{% ES5 %}
```js
( function( blocks, element ) {
	var el = element.createElement;

	var blockStyle = {
		backgroundColor: '#900',
		color: '#fff',
		padding: '20px',
	};

	blocks.registerBlockType( 'gutenberg-examples/example-01-basic', {
		title: 'Example: Basic',
		icon: 'universal-access-alt',
		category: 'layout',
		example: {},
		edit: function() {
			return el(
				'p',
				{ style: blockStyle },
				'Hello World, step 1 (from the editor).'
			);
		},
		save: function() {
			return el(
				'p',
				{ style: blockStyle },
				'Hello World, step 1 (from the frontend).'
			);
		},
	} );
}(
	window.wp.blocks,
	window.wp.element
) );
```
{% end %}

_By now you should be able to see `Hello World, step 1 (from the editor).` in the admin side and `Hello World, step 1 (from the frontend).` on the frontend side._

Once a block is registered, you should immediately see that it becomes available as an option in the editor inserter dialog, using values from `title`, `icon`, and `category` to organize its display. You can choose an icon from any included in the built-in [Dashicons icon set](https://developer.wordpress.org/resource/dashicons/), or provide a [custom svg element](/docs/designers-developers/developers/block-api/block-registration.md#icon-optional).

A block name must be prefixed with a namespace specific to your plugin. This helps prevent conflicts when more than one plugin registers a block with the same name. In this example, the namespace is `gutenberg-examples`.

Block names _must_ include only lowercase alphanumeric characters or dashes and start with a letter. Example: `my-plugin/my-custom-block`.

The `edit` and `save` functions describe the structure of your block in the context of the editor and the saved content respectively. While the difference is not obvious in this simple example, in the following sections we'll explore how these are used to enable customization of the block in the editor preview.
