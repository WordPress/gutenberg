# Block Actions

`BlockActions` provides handlers for acting on a set of blocks — duplicating, removing, inserting, grouping, ungrouping, and pasting styles — along with flags describing which of those actions are available. It renders no UI of its own; consumers supply a render prop and build their own controls.

_Note:_ This component is internal to the block editor. It is not exported from `@wordpress/block-editor`, so it can only be imported relatively from within the package.

## Development guidelines

### Usage

```jsx
import BlockActions from '../block-actions';

<BlockActions clientIds={ selectedBlockIds }>
	{ ( { onDuplicate, canDuplicate, onRemove, canRemove } ) => (
		<>
			{ canDuplicate && (
				<button onClick={ onDuplicate }>Duplicate</button>
			) }
			{ canRemove && <button onClick={ onRemove }>Remove</button> }
		</>
	) }
</BlockActions>;
```

### Props

#### `clientIds`

-   **Type:** `String[]`

The client IDs of the blocks to act on.

#### `children`

-   **Type:** `Function`

A render prop called with a single object argument. Its properties are:

Availability flags:

-   `canRemove` (`Boolean`): Whether the blocks can be removed.
-   `canDuplicate` (`Boolean`): Whether every block supports multiple instances and can be inserted into the current parent.
-   `canInsertBlock` (`Boolean`): Whether a new block can be inserted next to the blocks.
-   `canCopyStyles` (`Boolean`): Whether every block supports color or typography, and so has styles to copy.

Action handlers:

-   `onDuplicate` (`Function`): Duplicates the blocks. Returns the result of the `duplicateBlocks` dispatch.
-   `onRemove` (`Function`): Removes the blocks. Returns the result of the `removeBlocks` dispatch.
-   `onInsertBefore` (`Function`): Inserts a default block before the first block.
-   `onInsertAfter` (`Function`): Inserts a default block after the last block.
-   `onGroup` (`Function`): Replaces the blocks with a single grouping block containing them.
-   `onUngroup` (`Function`): Replaces the block with its inner blocks.
-   `onCopy` (`Function`): Flashes a single selected block to signal it was copied. Writing to the clipboard is the consumer's responsibility.
-   `onPasteStyles` (`Function`): Applies the copied styles to the blocks. Returns a `Promise`.

#### `__experimentalUpdateSelection`

-   **Type:** `Boolean`
-   **Default:** `true`

Whether the block selection should be updated after duplicating or removing. Passed straight through to the `duplicateBlocks` and `removeBlocks` actions.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
