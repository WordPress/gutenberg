# Writing Your First Block Type

To keep things simple for our first example, let's create a new block type which displays a styled message in a post. At this point, we won't allow the user to edit the message. We'll learn more about editable fields in later sections.

Blocks containing static content are implemented entirely in JavaScript using the `registerBlockType` function. This function is responsible for specifying the blueprint of a block, describing the behaviors necessary for the editor to understand how it appears, changes when edited, and is ultimately saved in the post's content.

## Enqueuing Block Scripts

While the block's editor behaviors are implemented in JavaScript, you'll need to register your block server-side to ensure that the script is enqueued when the editor loads. Register scripts and styles using [`wp_register_script`](https://developer.wordpress.org/reference/functions/wp_register_script/) and [`wp_register_style`](https://developer.wordpress.org/reference/functions/wp_register_style/), then assign these as handles associated with your block using the `script`, `style`, `editor_script`, and `editor_style` block type registration settings. The `editor_`-prefixed handles will only be enqueued in the context of the editor, while `script` and `style` will be enqueued both in the editor and when viewing a post on the front of your site.

```php
<?php
/*
Plugin Name: Gutenberg examples 01
*/
function gutenberg_examples_01_register_block() {
	wp_register_script(
		'gutenberg-examples-01',
		plugins_url( 'block.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element' )
	);

	register_block_type( 'gutenberg-examples/example-01-basic', array(
		'editor_script' => 'gutenberg-examples-01',
	) );

}
add_action( 'init', 'gutenberg_examples_01_register_block' );
```

Note the two script dependencies:

- __`wp-blocks`__ includes block type registration and related functions
- __`wp-element`__ includes the [WordPress Element abstraction](/packages/element/README.md) for describing the structure of your blocks

If you were to use a component from the `wp-editor` package, for example the RichText component, you would also need to add `wp-editor` to the dependency list.

## Registering the Block

With the script enqueued, let's look at the implementation of the block itself:

{% codetabs %}
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
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;

const blockStyle = {
	backgroundColor: '#900',
	color: '#fff',
	padding: '20px',
};

registerBlockType( 'gutenberg-examples/example-01-basic-esnext', {
	title: 'Example: Basic (esnext)',
	icon: 'universal-access-alt',
	category: 'layout',
	edit() {
		return <div style={ blockStyle }>Hello World, step 1 (from the editor).</div>;
	},
	save() {
		return <div style={ blockStyle }>Hello World, step 1 (from the frontend).</div>;
	},
} );
```
{% end %}

_By now you should be able to see `Hello World, step 1 (from the editor).` in the admin side and `Hello World, step 1 (from the frontend).` on the frontend side._

Once a block is registered, you should immediately see that it becomes available as an option in the editor inserter dialog, using values from `title`, `icon`, and `category` to organize its display. You can choose an icon from any included in the built-in [Dashicons icon set](https://developer.wordpress.org/resource/dashicons/), or provide a [custom svg element](/docs/designers-developers/developers/block-api/block-registration.md#icon-optional).

A block name must be prefixed with a namespace specific to your plugin. This helps prevent conflicts when more than one plugin registers a block with the same name. In this example, the namespace is `gutenberg-examples`.

The `edit` and `save` functions describe the structure of your block in the context of the editor and the saved content respectively. While the difference is not obvious in this simple example, in the following sections we'll explore how these are used to enable customization of the block in the editor preview.
