# Block Lock

The `Block Lock` module provides UI components and hooks for managing block locking in the WordPress editor. This includes locking block movement, editing, and removal.

These are private components of the `@wordpress/block-editor` package. They are not exported publicly and are meant to be consumed from within the package only.

## Components

### `BlockLockMenuItem`
A menu item component that allows users to lock or unlock a block via a modal.

#### Props
- `clientId` (string): The unique identifier of the block.

### `BlockLockModal`
A modal component that provides detailed lock options for a block.

#### Props
- `clientId` (string): The unique identifier of the block.
- `onClose` (function): Callback function triggered when the modal is closed.

### `BlockLockToolbar`
A toolbar button component that provides a lock/unlock button for a block.

#### Props
- `clientId` (string): The unique identifier of the block.

## Hook

### `useBlockLock`
A custom hook that returns lock status and permissions for a given block.

#### Parameters
- `clientId` (string): The unique identifier of the block.

#### Returns
An object containing:
- `isEditLocked` (boolean): Whether editing the block is locked.
- `isMoveLocked` (boolean): Whether moving the block is locked.
- `isRemoveLocked` (boolean): Whether removing the block is locked.
- `canLock` (boolean): Whether the block type allows locking.
- `isLocked` (boolean): Whether any of the block's lock features are applied.

## Usage

```jsx
/**
 * Internal dependencies
 */
import { BlockLockMenuItem, BlockLockToolbar } from '../block-lock';

function MyBlockControls( { clientId } ) {
    return (
        <>
            <BlockLockToolbar clientId={ clientId } />
            <BlockLockMenuItem clientId={ clientId } />
        </>
    );
}
```

## Implementation Details
- The `BlockLockMenuItem` and `BlockLockToolbar` components toggle the `BlockLockModal`.
- The modal allows users to specify which lock features to apply.
- The `useBlockLock` hook determines the lock state and permissions based on the block's settings and editor state.

This module enhances block editing control by allowing users to enforce restrictions on movement, editing, and removal.

