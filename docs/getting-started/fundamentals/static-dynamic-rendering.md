# Static or Dynamic rendering of a block

The blocks's markup returned for the front end can be dynamically generated on the server when the block is requested from the client (dynamic blocks) or statically when the block is saved in the Block Editor (static blocks).

<div class="callout callout-tip">
The post <a href="https://developer.wordpress.org/news/2023/02/27/static-vs-dynamic-blocks-whats-the-difference/">Static vs. dynamic blocks: What’s the difference?</a> provides a great introduction to static and dynamic blocks
</div>

## Blocks with Static Rendering 

![](https://developer.wordpress.org/files/2023/12/static-rendering.png)

Blocks have static rendering (a.k.a. Static Blocks) **when no dynamic rendering method has been defined (or is available) for the block**. In this case, the output for the front end will be taken from the [markup representation of the block in the database](https://developer.wordpress.org/block-editor/getting-started/fundamentals/markup-representation-block/) that is generated (returned by the `save` function) when the block is saved in the Block Editor via the p.

### How to define static rendering for a block

The `save` function, which can be defined when registering a block on the client, determines the markup of the block that will be stored in the database when the content is saved and eventually returned to the front end when there's a request. This markup is stored wrapped up in [unique block delimiters](https://developer.wordpress.org/block-editor/getting-started/fundamentals/markup-representation-block/), and only the markup inside these block indicators is returned as the markup to be rendered for the block in the front end.

_Example of `save` function_

```js
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { fallbackCurrentYear, showStartingYear, startingYear } = attributes;

	if ( ! fallbackCurrentYear ) return null;
	let displayDate;

	if ( showStartingYear && startingYear ) {
		displayDate = startingYear + '–' + fallbackCurrentYear;
	} else {
		displayDate = fallbackCurrentYear;
	}

	return <p { ...useBlockProps.save() }>© { displayDate }</p>;
}
```

_(see the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/save.js) in [an example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/copyright-date-block-09aac3))_

Blocks with dynamic rendering can also define a markup representation of the block via `save` as a backup for when the dynamic rendering method is no longer available (uninstallation of the plugin that registered the block). If no dynamic rendering method is found, any markup representation of the block in the database will be returned to the front end.

<div class="callout callout-info">
Even for static blocks, the markup stored for a block can be modified before it gets rendered on the front end via hooks such as <a href="https://developer.wordpress.org/reference/functions/render_block/"><code>render_block</code></a>.
</div>

## Blocks with Dynamic Rendering

Blocks with Dynamic Rendering (a.k.a. Dynamic Blocks) are blocks that **build their structure and content on the fly when the block is requested from the client**.

![](https://developer.wordpress.org/files/2023/12/dynamic-rendering.png)

There are two primary uses for dynamic blocks:

1. **Blocks where content should change even if a post has not been updated**. An example is the Latest Posts block - this block will update everywhere it is used when a new post is published.
2. **Blocks where updates to the code (HTML, CSS, JS) should be immediately shown on the front end of the website**. For example, if you update the structure of a block by adding a new class, adding an HTML element, or changing the layout in any other way, using a dynamic block ensures those changes are applied immediately on all occurrences of that block across the site. If a dynamic block is not used then when block code is updated Gutenberg's [validation process](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#validation) generally applies, causing users to see the validation message, "This block appears to have been modified externally".

### How to define dynamic rendering for a block

A block can define dynamic rendering in two main ways:
1. Via the `render_callback` argument that can be passed to the [`register_block_type()` function](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/#registration-of-the-block-with-php-server-side).
1. Via a separate PHP file (usually named `render.php`) which path can be defined at the [`render` property of the `block.json`](https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-json/#files-for-the-blocks-behavior-output-or-style).

Both of these ways to define the block's dynamic rendering receive the following data:
 - `$attributes` - The array of attributes for this block.
 - `$content` - Rendered block output.
 - `$block` - The instance of the [WP_Block](https://developer.wordpress.org/reference/classes/wp_block/) class that represents the block being rendered.

_Example of `render.php` file for a block with `"render": "file:./render.php"` in its `block.json`_

```php

$current_year = gmdate( 'Y' );

if ( isset( $attributes['fallbackCurrentYear'] ) && $attributes['fallbackCurrentYear'] === $current_year ) {
	$block_content = $content;
} else {

	if ( ! empty( $attributes['startingYear'] ) && ! empty( $attributes['showStartingYear'] ) ) {
		$display_date = $attributes['startingYear'] . '–' . $current_year;
	} else {
		$display_date = $current_year;
	}

	$block_content = '<p ' . get_block_wrapper_attributes() . '>© ' . esc_html( $display_date ) . '</p>';
}

echo wp_kses_post( $block_content );
```

_(see the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/render.php) in [an example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/copyright-date-block-09aac3))_

### HTML representation of dynamic blocks in the database (`save`)

For dynamic blocks, the `save` callback function can return just `null`, which tells the editor to save only the [block attributes](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/) to the database. These attributes are then passed into the server-side rendering callback, so you can decide how to display the block on the front end of your site. **When `save` is `null`, the Block Editor will skip the block markup validation process**, avoiding issues with frequently-changing markup.

Blocks with dynamic rendering can also save an HTML representation of the block. If you provide a server-side rendering callback, this HTML will be replaced with the output of your callback, but will be rendered if your block is deactivated or your render callback is removed.

If you are using [InnerBlocks](/docs/how-to-guides/block-tutorial/nested-blocks-inner-blocks.md) in a dynamic block you will need to save the `InnerBlocks` in the `save` callback function using `<InnerBlocks.Content/>`


## Additional Resources

- [Static vs. dynamic blocks: What’s the difference?](https://developer.wordpress.org/news/2023/02/27/static-vs-dynamic-blocks-whats-the-difference/)
- [Block deprecation – a tutorial](https://developer.wordpress.org/news/2023/03/10/block-deprecation-a-tutorial/)