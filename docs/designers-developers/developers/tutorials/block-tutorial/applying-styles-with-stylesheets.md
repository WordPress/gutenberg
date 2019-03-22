# Applying Styles From a Stylesheet

In the previous step, the block had applied its own styles by an inline `style` attribute. While this might be adequate for very simple components, you will quickly find that it becomes easier to write your styles by extracting them to a separate stylesheet file.

The editor will automatically generate a class name for each block type to simplify styling. It can be accessed from the object argument passed to the edit and save functions. In step 2, we will create a stylesheet to use that class name.

{% codetabs %}
{% ES5 %}
```js
var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType;

registerBlockType( 'gutenberg-examples/example-02-stylesheets', {
	title: 'Example: Stylesheets',

	icon: 'universal-access-alt',

	category: 'layout',

	edit: function( props ) {
		return el(
			'p',
			{ className: props.className },
			'Hello World, step 2 (from the editor, in green).'
		);
	},

	save: function() {
		return el(
			'p',
			{},
			'Hello World, step 2 (from the frontend, in red).'
		);
	}
} );
```
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;

registerBlockType( 'gutenberg-examples/example-02-stylesheets', {
	title: 'Example: Stylesheets',

	icon: 'universal-access-alt',

	category: 'layout',

	edit( { className } ) {
		return <p className={ className }>Hello World, step 2 (from the editor, in green).</p>;
	},

	save() {
		return <p>Hello World, step 2 (from the frontend, in red)./p>;
	}
} );
```
{% end %}

The class name is generated using the block's name prefixed with `wp-block-`, replacing the `/` namespace separator with a single `-`.

```css
.wp-block-gutenberg-examples-example-02-stylesheets {
	color: green;
	background: #cfc;
	border: 2px solid #9c9;
	padding: 20px;
}
```

## Enqueueing Editor and Front end Assets

Like scripts, your block's editor-specific styles should be enqueued by assigning the `editor_style` setting of the registered block type.

To enqueue a style that shows on both the front of your site and the editor, use `style` setting.

When registering a block, you can assign one or both of `style` and `editor_style` to respectively assign styles always loaded for a block, or styles only loaded in the editor.

Example 2 shows having a distinct style for each context. Your block is likely to share some styles in both contexts, so in this example you can consider `style.css` as the base stylesheet, placing editor-specific styles in `editor.css`.

```php
<?php

function gutenberg_examples_02_register_block() {
	wp_register_script(
		'gutenberg-examples-02',
		plugins_url( 'block.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'block.js' )
	);

	wp_register_style(
		'gutenberg-examples-02-editor',
		plugins_url( 'editor.css', __FILE__ ),
		array( 'wp-edit-blocks' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'editor.css' )
	);

	wp_register_style(
		'gutenberg-examples-02',
		plugins_url( 'style.css', __FILE__ ),
		array( ),
		filemtime( plugin_dir_path( __FILE__ ) . 'style.css' )
	);

	register_block_type( 'gutenberg-examples/example-02-stylesheets', array(
		'style' => 'gutenberg-examples-02',
		'editor_style' => 'gutenberg-examples-02-editor',
		'editor_script' => 'gutenberg-examples-02',
	) );
}
add_action( 'init', 'gutenberg_examples_02_register_block' );
```

