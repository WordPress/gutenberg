# Writing Your First Block Type

To keep things simple for our first example, let's create a new block type which displays a styled message in a post. At this point, we won't allow the user to edit the message. We'll learn more about editable fields in later sections.

Blocks containing static content are implemented entirely in JavaScript using the `registerBlockType` function. This function is responsible for specifying the blueprint of a block, describing the behaviors necessary for the editor to understand how it appears, changes when edited, and is ultimately saved in the post's content.

## Enqueueing Block Scripts

While the block type itself is implemented in JavaScript, you'll need to use the `enqueue_block_editor_assets` [WordPress action](https://codex.wordpress.org/Glossary#Action) to have your scripts included in the editor. This is similar to the [`wp_enqueue_scripts` action](https://developer.wordpress.org/reference/hooks/wp_enqueue_scripts/), but specifically targeting editor scripts and styles.

```php
<?php

function gutenberg_boilerplate_enqueue_block_editor_assets() {
	wp_enqueue_script(
		'gutenberg-boilerplate-es5-step01',
		plugins_url( 'step-01/block.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element' )
	);
}
add_action( 'enqueue_block_editor_assets', 'gutenberg_boilerplate_enqueue_block_editor_assets' );
```

Note the two script dependencies:

- __`wp-blocks`__ includes block type registration and related functions
- __`wp-element`__ includes the [WordPress Element abstraction](https://github.com/WordPress/gutenberg/tree/master/element) for describing the structure of your blocks

## Registering the Block

With the script enqueued, let's look at the implementation of the block itself:

{% codetabs %}
{% ES5 %}
```js
var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType,
	blockStyle = { backgroundColor: '#900', color: '#fff', padding: '20px' };

registerBlockType( 'gutenberg-boilerplate-es5/hello-world-step-01', {
	title: 'Hello World (Step 1)',

	icon: 'universal-access-alt',

	category: 'layout',

	edit: function() {
		return el( 'p', { style: blockStyle }, 'Hello editor.' );
	},

	save: function() {
		return el( 'p', { style: blockStyle }, 'Hello saved content.' );
	},
} );
```
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;
const blockStyle = { backgroundColor: '#900', color: '#fff', padding: '20px' };

registerBlockType( 'gutenberg-boilerplate-esnext/hello-world-step-01', {
	title: 'Hello World (Step 1)',

	icon: 'universal-access-alt',

	category: 'layout',

	edit() {
		return <p style={ blockStyle }>Hello editor.</p>;
	},

	save() {
		return <p style={ blockStyle }>Hello saved content.</p>;
	},
} );
```
{% end %}

Once a block is registered, you should immediately see that it becomes available as an option in the editor inserter dialog, using values from `title`, `icon`, and `category` to organize its display. You can choose an icon from any included in the built-in [Dashicons icon set](https://developer.wordpress.org/resource/dashicons/), or provide your own by assigning the value of `icon` as a [WordPress Element](https://github.com/WordPress/gutenberg/tree/master/element) element or component.

A block name must be prefixed with a namespace specific to your plugin. This helps prevent conflicts when more than one plugin registers a block with the same name.

The `edit` and `save` functions describe the structure of your block in the context of the editor and the saved content respectively. While the difference is not obvious in this simple example, in the following sections we'll explore how these are used to enable customization of the block in the editor preview.
