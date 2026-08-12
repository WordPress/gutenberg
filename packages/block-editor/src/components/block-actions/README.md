# Block Actions

`BlockActions` is a render prop component that resolves, for a given set of blocks, which manipulation actions are available and how to perform them. It is what backs the block settings menu: duplicating, removing, inserting before or after, grouping and ungrouping, copying, and pasting styles.

_Note:_ This component is internal to the `@wordpress/block-editor` package. It is not exported from the package, so it can only be imported relatively from within the package itself.

## Development guidelines

### Usage

Wrap the UI that offers the actions, and use the flags passed to the render prop to decide which controls to show.

```jsx
import { MenuGroup, MenuItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockActions from '../block-actions';

function MyBlockMenu( { clientIds } ) {
	return (
		<BlockActions clientIds={ clientIds }>
			{ ( { canDuplicate, canRemove, onDuplicate, onRemove } ) => (
				<MenuGroup>
					{ canDuplicate && (
						<MenuItem onClick={ onDuplicate }>Duplicate</MenuItem>
					) }
					{ canRemove && (
						<MenuItem onClick={ onRemove }>Delete</MenuItem>
					) }
				</MenuGroup>
			) }
		</BlockActions>
	);
}
```

### Props

#### `clientIds`

-   **Type:** `Array`

The client IDs of the blocks the actions apply to.

#### `__experimentalUpdateSelection`

-   **Type:** `Boolean`
-   **Default:** `true`

Whether the block selection should be updated after duplicating or removing the blocks. It is passed straight through to the `duplicateBlocks` and `removeBlocks` actions of the block editor store.

#### `children`

-   **Type:** `Function`

A render prop, called with a single object argument. Nothing is rendered by the component itself.

The object carries four flags describing what the current blocks allow:

-   `canRemove` (`Boolean`): Whether the blocks can be removed.
-   `canDuplicate` (`Boolean`): Whether every block supports multiple instances and can be inserted into its current parent.
-   `canInsertBlock` (`Boolean`): Whether the default block, or the parent's directly inserted block, can be inserted next to the blocks.
-   `canCopyStyles` (`Boolean`): Whether every block supports `color` or `typography`, and therefore has styles worth copying.

...and eight handlers:

-   `onDuplicate` (`Function`): Duplicates the blocks and returns the result of the `duplicateBlocks` dispatch.
-   `onRemove` (`Function`): Removes the blocks and returns the result of the `removeBlocks` dispatch.
-   `onInsertBefore` (`Function`): Inserts a default block before the first of the blocks.
-   `onInsertAfter` (`Function`): Inserts a default block after the last of the blocks.
-   `onGroup` (`Function`): Replaces the blocks with a single grouping block wrapping them. Does nothing if the blocks cannot be transformed.
-   `onUngroup` (`Function`): Replaces the first block with its inner blocks. Does nothing if it has none.
-   `onCopy` (`Function`): Announces the copy with a snackbar notice, and flashes the block when a single one is selected. It does not write to the clipboard — the consumer is responsible for that.
-   `onPasteStyles` (`Function`): Applies the styles held in the clipboard to the blocks. Returns a promise.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
