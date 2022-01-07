# Nested Blocks: Using InnerBlocks

You can create a single block that nests other blocks using the [InnerBlocks](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-editor/src/components/inner-blocks/README.md) component. This is used in the Columns block, Social Links block, or any block you want to contain other blocks.

Note: A single block can only contain one `InnerBlock` component.

Here is the basic InnerBlocks usage.

{% codetabs %}
{% JSX %}

```js
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

registerBlockType( 'gutenberg-examples/example-06', {
	// ...

	edit: () => {
		const blockProps = useBlockProps();

		return (
			<div { ...blockProps }>
				<InnerBlocks />
			</div>
		);
	},

	save: () => {
		const blockProps = useBlockProps.save();

		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	},
} );
```

{% Plain %}

```js
( function ( blocks, element, blockEditor ) {
	var el = element.createElement;
	var InnerBlocks = blockEditor.InnerBlocks;
	var useBlockProps = blockEditor.useBlockProps;

	blocks.registerBlockType( 'gutenberg-examples/example-06', {
		title: 'Example: Inner Blocks',
		category: 'design',

		edit: function () {
			var blockProps = useBlockProps();

			return el( 'div', blockProps, el( InnerBlocks ) );
		},

		save: function () {
			var blockProps = useBlockProps.save();

			return el( 'div', blockProps, el( InnerBlocks.Content ) );
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor );
```

{% end %}

## Allowed Blocks

Using the `ALLOWED_BLOCKS` property, you can define the set of blocks allowed in your InnerBlock. This restricts the blocks that can be included only to those listed, all other blocks will not show in the inserter.

```js
const ALLOWED_BLOCKS = [ 'core/image', 'core/paragraph' ];
//...
<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } />;
```

## Orientation

By default, `InnerBlocks` expects its blocks to be shown in a vertical list. A valid use-case is to style inner blocks to appear horizontally, for instance by adding CSS flex or grid properties to the inner blocks wrapper. When blocks are styled in such a way, the `orientation` prop can be set to indicate that a horizontal layout is being used:

```js
<InnerBlocks orientation="horizontal" />
```

Specifying this prop does not affect the layout of the inner blocks, but results in the block mover icons in the child blocks being displayed horizontally, and also ensures that drag and drop works correctly.

## Template

Use the template property to define a set of blocks that prefill the InnerBlocks component when inserted. You can set attributes on the blocks to define their use. The example below shows a book review template using InnerBlocks component and setting placeholders values to show the block usage.

{% codetabs %}
{% JSX %}

```js
const MY_TEMPLATE = [
	[ 'core/image', {} ],
	[ 'core/heading', { placeholder: 'Book Title' } ],
	[ 'core/paragraph', { placeholder: 'Summary' } ],
];

//...

	edit: () => {
		return (
			<InnerBlocks
				template={ MY_TEMPLATE }
				templateLock="all"
			/>
		);
	},
```

{% Plain %}

```js
const MY_TEMPLATE = [
	[ 'core/image', {} ],
	[ 'core/heading', { placeholder: 'Book Title' } ],
	[ 'core/paragraph', { placeholder: 'Summary' } ],
];

//...

	edit: function( props ) {
		return el(
			InnerBlocks,
			{
				template: MY_TEMPLATE,
				templateLock: "all",
			}
		);
	},
```

{% end %}

Use the `templateLock` property to lock down the template. Using `all` locks the template completely so no changes can be made. Using `insert` prevents additional blocks from being inserted, but existing blocks can be reordered. See [templateLock documentation](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-editor/src/components/inner-blocks/README.md#templatelock) for additional information.

### Post Template

Unrelated to `InnerBlocks` but worth mentioning here, you can create a [post template](https://developer.wordpress.org/block-editor/developers/block-api/block-templates/) by post type, that preloads the block editor with a set of blocks.

The `InnerBlocks` template is for the component in the single block that you created, the rest of the post can include any blocks the user likes. Using a post template, can lock the entire post to just the template you define.

```php
add_action( 'init', function() {
	$post_type_object = get_post_type_object( 'post' );
	$post_type_object->template = array(
		array( 'core/image' ),
		array( 'core/heading' )
	);
} );
```

## Parent-Child InnerBlocks

A common pattern for using InnerBlocks is to create a custom block that will be included only in the InnerBlocks. An example of this is the Columns block, that creates a single parent block called `columns` and then creates an child block called `column`. The parent block is defined to only allow the child blocks. See [Column code for reference](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-library/src/column).

When defining a child block, use the `parent` block setting to define which block is the parent. This prevents the block showing in the inserter outside of the InnerBlock it is defined for.

```js
export const settings = {
	title: __( 'Column' ),
	parent: [ 'core/columns' ],
	icon,
	description: __( 'A single column within a columns block.' ),
	//...
};
```
