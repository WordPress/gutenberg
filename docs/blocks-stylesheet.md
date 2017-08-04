# Applying Styles From a Stylesheet

In the previous section, the block had applied its own styles by an inline `style` attribute. While this might be adequate for very simple components, you will quickly find that it becomes easier to write your styles by extracting them to a separate stylesheet file.

The editor will automatically generate a class name for each block type to simplify styling. It can be accessed from the object argument passed to the edit and save functions:

{% codetabs %}
{% ES5 %}
```js
var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType;

registerBlockType( 'gutenberg-boilerplate-es5/hello-world-step-02', {
	title: 'Hello World (Step 2)',

	icon: 'universal-access-alt',

	category: 'layout',

	edit: function( props ) {
		return el( 'p', { className: props.className }, 'Hello editor.' );
	},

	save: function( props ) {
		return el( 'p', { className: props.className }, 'Hello saved content.' );
	},
} );
```
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;

registerBlockType( 'gutenberg-boilerplate-esnext/hello-world-step-02', {
	title: 'Hello World (Step 2)',

	icon: 'universal-access-alt',

	category: 'layout',

	edit( { className } ) {
		return <p className={ className }>Hello editor.</p>;
	},

	save( { className } ) {
		return <p className={ className }>Hello saved content.</p>;
	},
} );
```
{% end %}

The class name is generated using the block's name prefixed with `wp-block-`, replacing the `/` namespace separator with a single `-`.

```css
.wp-block-gutenberg-boilerplate-es5-hello-world-step-02 {
	color: green;
	background: #cfc;
	border: 2px solid #9c9;
	padding: 20px;
}
```

## Enqueueing Editor-only Block Assets

Like scripts, your block's editor-specific styles should be enqueued during the `enqueue_block_editor_assets` action.

```php
<?php

function gutenberg_boilerplate_enqueue_block_editor_assets() {
	wp_enqueue_script(
		'gutenberg-boilerplate-es5-step02',
		plugins_url( 'step-02/block.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element' )
	);
	wp_enqueue_style(
		'gutenberg-boilerplate-es5-step02-editor',
		plugins_url( 'step-02/editor.css', __FILE__ ),
		array( 'wp-edit-blocks' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'step-02/editor.css' )
	);
}
add_action( 'enqueue_block_editor_assets', 'gutenberg_boilerplate_enqueue_block_editor_assets' );
```

## Enqueueing Editor and Front end Assets

While a block's scripts are only necessary to load in the editor, you'll want to load styles both on the front of your site and in the editor. You may even want distinct styles in each context.

The `enqueue_block_editor_assets` action will only be triggered when the editor is loading. To enqueue styles for your block when viewing the front of your site, you should do so during the `enqueue_block_assets` action.

```php
<?php

function gutenberg_boilerplate_es5_enqueue_common_assets() {
	wp_enqueue_style(
		'gutenberg-boilerplate-es5-step02',
		plugins_url( 'step-02/style.css', __FILE__ ),
		array( 'wp-blocks' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'step-02/style.css' )
	);
}
add_action( 'enqueue_block_assets', 'gutenberg_boilerplate_es5_enqueue_common_assets' );
```

The `enqueue_block_assets` action is triggered both in the editor and on the front of the site. Since your block is likely to share some styles in both contexts, you can consider `style.css` as the base stylesheet, placing editor-specific styles in `editor.css`.

If you'd like the scripts to be limited to your site's front end only, you can use `enqueue_block_assets` and enqueue your scripts only if [`! is_admin()`](https://developer.wordpress.org/reference/functions/is_admin/) applies.
