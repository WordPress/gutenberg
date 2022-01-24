# InnerBlocks

InnerBlocks exports a pair of components which can be used in block implementations to enable nested block content.

Refer to the [implementation of the Columns block](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-library/src/columns) as an example resource.

## Usage

In a block's `edit` implementation, render `InnerBlocks`. Then, in the `save` implementation, render `InnerBlocks.Content`. This will be replaced automatically with the content of the nested blocks.

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

registerBlockType( 'my-plugin/my-block', {
	// ...

	edit() {
		const blockProps = useBlockProps();

		return (
			<div { ...blockProps }>
				<InnerBlocks />
			</div>
		);
	},

	save() {
		const blockProps = useBlockProps.save();

		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	},
} );
```

_Note:_ A block can render at most a single `InnerBlocks` and `InnerBlocks.Content` element in `edit` and `save` respectively. To create distinct arrangements of nested blocks, create a separate block type which renders its own `InnerBlocks` and assign as the sole `allowedBlocks` type.

_Note:_ Because the save step will automatically apply props to the element returned by `save`, it is important to include the wrapping `div` in the above simple example even though we are applying no props of our own. In a real-world example, you may have your own attributes to apply to the saved markup, or sibling content adjacent to the rendered nested blocks.

_Note:_ Inner blocks, by default, are not visible inside a WordPress excerpt. If you wish your block to appear then it needs to be returned from the `excerpt_allowed_wrapper_blocks` filter. More details can be found on the [filter reference page](https://developer.wordpress.org/reference/hooks/excerpt_allowed_wrapper_blocks/) page, as well as the [excerpt_remove_blocks](https://developer.wordpress.org/reference/functions/excerpt_remove_blocks/) page.

## Props

### `allowedBlocks`

-   **Type:** `Boolean|Array<String>`
-   **Default:** `true`

`allowedBlocks` can contain an array of strings, each string should contain the identifier of a block. When `allowedBlocks` is set it is only possible to insert blocks part of the set specified in the array.

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

If `allowedBlocks` is set to `true`, all blocks are allowed. `false` means no blocks are allowed.

### `orientation`

-   **Type:** `"horizontal"|"vertical"|undefined`

Indicates whether inner blocks are shown horizontally or vertically. Use the string 'horizontal' or 'vertical' as a value. When left unspecified, defaults to 'vertical'.

While this prop doesn't change any styles for the inner blocks themselves, it does display the Block Movers in the correct orientation, and also ensures drag and drop works correctly.

### `template`

-   **Type:** `Array<Array<Object>>`

The template is defined as a list of block items. Such blocks can have predefined attributes, placeholder, content, etc. Block templates allow specifying a default initial state for an InnerBlocks area.
More information about templates can be found in [template docs](/docs/reference-guides/block-api/block-templates.md).

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

-   **Type:** `Boolean`
-   **Default:** `false`

If true when child blocks in the template are inserted the selection is updated.
If false the selection should not be updated when child blocks specified in the template are inserted.

### `templateLock`

-   **Type:** `String|Boolean`

Template locking of `InnerBlocks` is similar to [Custom Post Type templates locking](/docs/reference-guides/block-api/block-templates.md#locking).

Template locking allows locking the `InnerBlocks` area for the current template.
_Options:_

-   `'all'` — prevents all operations. It is not possible to insert new blocks. Move existing blocks or delete them.
-   `'insert'` — prevents inserting or removing blocks, but allows moving existing ones.
-   `false` — prevents locking from being applied to an `InnerBlocks` area even if a parent block contains locking. ( Boolean )

If locking is not set in an `InnerBlocks` area: the locking of the parent `InnerBlocks` area is used.

If the block is a top level block: the locking of the Custom Post Type is used.

### `renderAppender`

-   **Type:** `Component|false`
-   **Default:** - `undefined`. When `renderAppender` is not specified, the default appender is shown. If a `false` value is provided, no appender is rendered.

A component to show as the trailing appender for the inner blocks list.

#### Notes

-   For convenience two predefined appender components are exposed on `InnerBlocks` which can be used for the prop:
    -   `InnerBlocks.ButtonBlockAppender` - display a `+` (plus) icon button as the appender.
    -   `InnerBlocks.DefaultBlockAppender` - display the default block appender, typically the paragraph style appender when the paragraph block is allowed.
-   Consumers are also free to pass any valid component. This provides the full flexibility to define a bespoke block appender.

#### Example usage

```jsx
// Utilise a predefined component
<InnerBlocks
	renderAppender={ InnerBlocks.ButtonBlockAppender }
/>

// Don't display an appender
<InnerBlocks
	renderAppender={ false }
/>

// Fully custom
<InnerBlocks
	renderAppender={ MyAmazingAppender }
/>
```

### `__experimentalCaptureToolbars`

-   **Type:** `Boolean`
-   **Default:** `false`

Determines whether the toolbars of _all_ child Blocks (applied deeply, recursive) should have their toolbars "captured" and shown on the Block which is consuming `InnerBlocks`.

For example, a button block, deeply nested in several levels of block `X` that utilizes this property will see the button block's toolbar displayed on block `X`'s toolbar area.

### `placeholder`

-   **Type:** `Function`
-   **Default:** - `undefined`. The placeholder is an optional function that can be passed in to be a rendered component placed in front of the appender. This can be used to represent an example state prior to any blocks being placed. See the Social Links for an implementation example.
