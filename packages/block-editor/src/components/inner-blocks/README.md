InnerBlocks
===========

InnerBlocks exports a pair of components which can be used in block implementations to enable nested block content.

Refer to the [implementation of the Columns block](https://github.com/WordPress/gutenberg/tree/master/packages/block-library/src/columns) as an example resource.

## Usage

In a block's `edit` implementation, render `InnerBlocks`. Then, in the `save` implementation, render `InnerBlocks.Content`. This will be replaced automatically with the content of the nested blocks.

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';

registerBlockType( 'my-plugin/my-block', {
	// ...

	edit( { className } ) {
		return (
			<div className={ className }>
				<InnerBlocks />
			</div>
		);
	},

	save() {
		return (
			<div>
				<InnerBlocks.Content />
			</div>
		);
	}
} );
```

_Note:_ A block can render at most a single `InnerBlocks` and `InnerBlocks.Content` element in `edit` and `save` respectively. To create distinct arrangements of nested blocks, create a separate block type which renders its own `InnerBlocks` and assign as the sole `allowedBlocks` type.

_Note:_ Because the save step will automatically apply props to the element returned by `save`, it is important to include the wrapping `div` in the above simple example even though we are applying no props of our own. In a real-world example, you may have your own attributes to apply to the saved markup, or sibling content adjacent to the rendered nested blocks.

## Props

### `allowedBlocks`
* **Type:** `Array<String>`

Allowed blocks prop should contain an array of strings, each string should contain the identifier of a block. When allowedBlocks is set it is only possible to insert blocks part of the set specified in the array.

```jsx
const ALLOWED_BLOCKS = [ 'core/image', 'core/paragraph' ];
...
<InnerBlocks
    allowedBlocks={ ALLOWED_BLOCKS }
/>
```

The previous code block creates an `InnerBlocks` area where only image and paragraph blocks can be inserted.

Child blocks that have marked themselves as compatible are not excluded from the allowed blocks. Even if `allowedBlocks` doesn't specify a child block, a registered child block will still appear on the inserter for this block.

```jsx
const ALLOWED_BLOCKS = [];
...
<InnerBlocks
    allowedBlocks={ ALLOWED_BLOCKS }
/>
```

The previous code block restricts all blocks, so only child blocks explicitly registered as compatible with this block can be inserted. If no child blocks are available: it will be impossible to insert any inner blocks.

### `template`
* **Type:** `Array<Array<Object>>`

The template is defined as a list of block items. Such blocks can have predefined attributes, placeholder, content, etc. Block templates allow specifying a default initial state for an InnerBlocks area.
More information about templates can be found in [template docs](/docs/developers/block-api/block-templates.md).

```jsx
const TEMPLATE = [ [ 'core/columns', {}, [
    [ 'core/column', {}, [
        [ 'core/image' ],
    ] ],
    [ 'core/column', {}, [
        [ 'core/paragraph', { placeholder: 'Enter side content...' } ],
    ] ],
] ] ];
...
<InnerBlocks
    template={ TEMPLATE }
/>
```

The previous example creates an InnerBlocks area containing two columns one with an image and the other with a paragraph.

### `templateInsertUpdatesSelection`
* **Type:** `Boolean`
* **Default:** `true`

If true when child blocks in the template are inserted the selection is updated.
If false the selection should not be updated when child blocks specified in the template are inserted.

### `templateLock`
* **Type:** `String|Boolean`

Template locking of `InnerBlocks` is similar to [Custom Post Type templates locking](/docs/developers/block-api/block-templates.md#locking).

Template locking allows locking the `InnerBlocks` area for the current template.
*Options:*

- `'all'` — prevents all operations. It is not possible to insert new blocks. Move existing blocks or delete them.
- `'insert'` — prevents inserting or removing blocks, but allows moving existing ones.
- `false` — prevents locking from being applied to an `InnerBlocks` area even if a parent block contains locking. ( Boolean )

If locking is not set in an `InnerBlocks` area: the locking of the parent `InnerBlocks` area is used.

If the block is a top level block: the locking of the Custom Post Type is used.

### `renderAppender`
* **Type:** `Function|false`
* **Default:** - `undefined`. When `renderAppender` is not specific the `<DefaultBlockAppender>` component is as a default. It automatically inserts whichever block is configured as the default block via `wp.blocks.setDefaultBlockName` (typically `paragraph`). If a `false` value is provider, no appender is rendered.

A 'render prop' function that can be used to customize the block's appender.

#### Notes
* For convenience two predefined appender components are exposed on `InnerBlocks` which can be consumed within the render function:
	- `<InnerBlocks.ButtonBlockAppender />` -  display a `+` (plus) icon button that, when clicked, displays the block picker menu. No default Block is inserted.
	- `<InnerBlocks.DefaultBlockAppender />` - display the default block appender as set by `wp.blocks.setDefaultBlockName`. Typically this is the `paragraph` block.
* Consumers are also free to pass any valid render function. This provides the full flexibility to define a bespoke block appender.

#### Example usage

```jsx
// Utilise a predefined component
<InnerBlocks
	renderAppender={ () => (
		<InnerBlocks.ButtonBlockAppender />
	) }
/>

// Fully custom
<InnerBlocks
	renderAppender={ () => (
		<button className="bespoke-appender" type="button">Some Special Appender</button>
	) }
/>
```

### `__experimentalCaptureToolbars`

* **Type:** `Boolean`
* **Default:** `false`

Determines whether the toolbars of _all_ child Blocks (applied deeply, recursive) should have their toolbars "captured" and shown on the Block which is consuming `InnerBlocks`.

For example, a button block, deeply nested in several levels of block `X` that utilises this property will see the button block's toolbar displayed on block `X`'s toolbar area.



