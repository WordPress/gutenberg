# Block Editing Mode

`useBlockEditingMode` is a hook that reads, and optionally sets, the editing mode of a block. The mode restricts the user interface that is displayed for editing that block.

The mode can be set to one of the following values:

-   `'disabled'`: Prevents editing the block entirely, i.e., it cannot be selected.
-   `'contentOnly'`: Hides all non-content UI, such as auxiliary controls in the toolbar, block movers, and block settings.
-   `'default'`: Allows editing the block as normal.

Modes don't cascade to inner blocks, with one exception: a block set to `'disabled'` also disables its inner blocks, unless an inner block has its own mode explicitly set.

If called outside of a block context, the mode is set on the editor root, which follows the same rule, so `'disabled'` applies to every block, while `'contentOnly'` does not.

A mode can also be derived rather than set by the block itself. Under a `templateLock: 'contentOnly'` ancestor, a block without an explicitly set mode is derived as `'contentOnly'` if it is a content block (it has an attribute with `role: 'content'`, or `supports.contentRole`), and as `'disabled'` otherwise. An explicitly set mode wins over these derived modes. See the [block locking guide](https://developer.wordpress.org/block-editor/how-to-guides/curating-the-editor-experience/block-locking/) for more on locking.

## Development guidelines

### Usage

Called without an argument, the hook returns the current mode for the block. This is the most common use, and lets a block hide controls when editing is restricted:

```jsx
import {
	BlockControls,
	useBlockEditingMode,
	useBlockProps,
} from '@wordpress/block-editor';

function MyBlock( { attributes, setAttributes } ) {
	const blockEditingMode = useBlockEditingMode();
	return (
		<>
			{ blockEditingMode === 'default' && (
				<BlockControls group="block">
					<MyToolbarControl />
				</BlockControls>
			) }
			<div { ...useBlockProps() }></div>
		</>
	);
}
```

Passing a mode sets it for the block:

```jsx
import {
	useBlockEditingMode,
	useBlockProps,
} from '@wordpress/block-editor';

function MyBlock( { attributes, setAttributes } ) {
	useBlockEditingMode( 'disabled' );
	return <div { ...useBlockProps() }></div>;
}
```

### Parameters

#### `mode`

-   **Type:** `String`
-   **Default:** `undefined`

The editing mode to set for the block. One of `'disabled'`, `'contentOnly'`, or `'default'`. If `undefined`, the current editing mode remains unchanged.

### Return

-   **Type:** `String`

The current editing mode for the block.
