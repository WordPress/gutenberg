# Block Editing Mode

The `block-editing-mode` component allows a block to restrict the user interface that is displayed for editing that block and its inner blocks.

## Usage

### Importing

```js
import { useBlockEditingMode } from '@wordpress/block-editor';
```

### Example

Called without an argument, the hook returns the current mode for the block. This is the most common use, and lets a block hide controls when editing is restricted:

```js
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

Passing a mode sets it for the block and its inner blocks:

```js
function MyBlock( { attributes, setAttributes } ) {
	useBlockEditingMode( 'disabled' );
	return <div { ...useBlockProps() }></div>;
}
```

### Modes

The `mode` parameter can be set to one of the following values:

-   `'disabled'`: Prevents editing the block entirely, i.e., it cannot be selected.
-   `'contentOnly'`: Hides all non-content UI, such as auxiliary controls in the toolbar, block movers, and block settings.
-   `'default'`: Allows editing the block as normal.

The mode is inherited by all of the block's inner blocks unless they have their own mode explicitly set.

If called outside of a block context, the mode is applied to all blocks.

### Template locks

A template lock can also set a mode, and it takes precedence over the mode a block sets for itself. If the template lock is `'contentOnly'`, the block's mode is overridden to `'contentOnly'` when the block has a content role attribute, and to `'disabled'` otherwise.

This means a block that calls `useBlockEditingMode( 'default' )` can still be rendered as `'contentOnly'` or `'disabled'`. If a mode doesn't appear to take effect, check whether a template lock applies to the block. See the [block locking guide](https://developer.wordpress.org/block-editor/how-to-guides/curating-the-editor-experience/block-locking/) for more on locking.

## API

### `useBlockEditingMode( mode )`

#### Parameters

-   `mode` (optional) - The editing mode to apply. If `undefined`, the current editing mode remains unchanged.

#### Returns

-   The current `BlockEditingMode` for the block.
