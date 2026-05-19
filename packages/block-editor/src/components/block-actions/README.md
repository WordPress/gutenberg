## BlockActions

`BlockActions` is a render prop component that provides a set of block manipulation actions and capability flags for one or more blocks identified by their client IDs. It encapsulates the logic for determining what operations are available on the selected blocks and exposes handlers to perform those operations.

## Development guidelines

### Usage

Renders block action handlers and capability flags via a render prop.

```jsx
import { BlockActions } from '@wordpress/block-editor';

const MyBlockToolbar = ( { clientIds } ) => (
	<BlockActions clientIds={ clientIds }>
		{ ( {
			canDuplicate,
			canRemove,
			canInsertBlock,
			canCopyStyles,
			onDuplicate,
			onRemove,
			onInsertBefore,
			onInsertAfter,
			onGroup,
			onUngroup,
			onCopy,
			onPasteStyles,
		} ) => (
			<>
				{ canDuplicate && (
					<button onClick={ onDuplicate }>Duplicate</button>
				) }
				{ canRemove && <button onClick={ onRemove }>Remove</button> }
			</>
		) }
	</BlockActions>
);
```

### Props

#### `clientIds`

-   **Type:** `string[]`
-   **Required:** Yes

An array of block client IDs for which the actions should be computed and applied.

#### `children`

-   **Type:** `Function`
-   **Required:** Yes

A render prop function invoked with an object containing capability flags and action handlers (see [Render prop values](#render-prop-values) below).

#### `__experimentalUpdateSelection`

-   **Type:** `boolean`
-   **Default:** `undefined`

When `true`, updating the selection after block operations such as duplicate or remove is enabled. This is an experimental prop.

### Render prop values

The `children` function is called with the following object:

#### `canCopyStyles`

-   **Type:** `boolean`

Whether styles can be copied from the selected blocks.

#### `canDuplicate`

-   **Type:** `boolean`

Whether the selected blocks can be duplicated.

#### `canInsertBlock`

-   **Type:** `boolean`

Whether a block can be inserted before or after the selected blocks.

#### `canRemove`

-   **Type:** `boolean`

Whether the selected blocks can be removed.

#### `onDuplicate()`

-   **Type:** `Function`

Duplicates all blocks identified by `clientIds`.

#### `onRemove()`

-   **Type:** `Function`

Removes all blocks identified by `clientIds`.

#### `onInsertBefore()`

-   **Type:** `Function`

Inserts a new block before the selected block.

#### `onInsertAfter()`

-   **Type:** `Function`

Inserts a new block after the selected block.

#### `onGroup()`

-   **Type:** `Function`

Groups all blocks identified by `clientIds` using the group block. Does nothing if `clientIds` is empty.

#### `onUngroup()`

-   **Type:** `Function`

Ungroups all blocks identified by `clientIds`. Does nothing if `clientIds` is empty or if the blocks are not grouped.

#### `onCopy()`

-   **Type:** `Function`

Triggers a flash highlight on the block when a single block is copied, providing visual feedback to the user.

#### `onPasteStyles()`

-   **Type:** `async Function`

Pastes styles onto all blocks identified by `clientIds`.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.