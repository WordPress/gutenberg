# Block Lock

The `BlockLock` components render the UI for locking a block's movement, editing and removal, and the `useBlockLock` hook exposes a block's current lock state. Movement and removal can be locked on any block; the editing option is only offered for an allowlist of block types, currently `core/navigation`.

These are private components of the `@wordpress/block-editor` package. They are not exported publicly and are meant to be consumed from within the package only.

## Development guidelines

### Usage

Renders a toolbar button that opens the block lock modal.

```jsx
/**
 * Internal dependencies
 */
import { BlockLockToolbar } from '../block-lock';

const MyBlockToolbar = ( { clientId } ) => (
	<BlockLockToolbar clientId={ clientId } />
);
```

### Components

#### `BlockLockMenuItem`

A menu item that opens the block lock modal for one or more blocks. Renders nothing unless every block type allows locking.

#### `BlockLockModal`

A modal that lets the user choose which lock features to apply to one or more blocks. When the blocks have different settings, a feature shows as mixed and keeps each block's current setting unless the user changes it.

#### `BlockLockToolbar`

A toolbar button that opens the block lock modal. Renders nothing until the block is locked.

### Props

#### `clientId`

-   **Type:** `String`
-   **Required:** Yes

The client ID of the block. Accepted by `BlockLockToolbar` only.

#### `clientIds`

-   **Type:** `Array`
-   **Required:** Yes

The client IDs of the blocks. Accepted by `BlockLockMenuItem` and `BlockLockModal`.

#### `onClose`

-   **Type:** `Function`
-   **Required:** Yes

A callback invoked when the modal is dismissed. Accepted by `BlockLockModal` only.

### `useBlockLock`

A hook that returns the lock state of a block. It accepts the block's client ID and returns an object with the following properties.

-   `isEditLocked` (`Boolean`): Whether editing the block is locked.
-   `isMoveLocked` (`Boolean`): Whether moving the block is locked.
-   `isRemoveLocked` (`Boolean`): Whether removing the block is locked.
-   `canLock` (`Boolean`): Whether the block type allows locking.
-   `isLocked` (`Boolean`): Whether any of the block's lock features are applied.

### `useBlocksLock`

A hook that returns the lock state shared by a group of blocks. It accepts an array of client IDs and returns an object with the following properties.

-   `canLock` (`Boolean`): Whether every block type allows locking.
-   `isLocked` (`Boolean`): Whether every block has at least one lock feature applied.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
