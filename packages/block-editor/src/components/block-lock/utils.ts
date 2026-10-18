import type { BlockLock, BlockLockSelection, SharedLockValue } from './types';

/**
 * Returns the `templateLock` value matching a block lock.
 *
 * @param lock The block lock.
 *
 * @return The template lock value.
 */
export function getTemplateLockValue( lock: BlockLock ) {
	// Prevents all operations.
	if ( lock.remove && lock.move ) {
		return 'all';
	}

	// Prevents inserting or removing blocks, but allows moving existing blocks.
	if ( lock.remove && ! lock.move ) {
		return 'insert';
	}

	return false;
}

/**
 * Returns a value shared by a group of blocks.
 *
 * @param values The value of each block.
 *
 * @return `true` when every value is true, `false` when none is, and `null`
 *         when the values differ.
 */
export function getSharedLockValue( values: boolean[] ): SharedLockValue {
	if ( values.every( Boolean ) ) {
		return true;
	}

	return values.some( Boolean ) ? null : false;
}

/**
 * Applies the lock features chosen in the modal to a block's current lock.
 * Features left mixed or not offered keep the block's current value.
 *
 * @param selection   The lock features chosen in the modal.
 * @param currentLock The block's current lock.
 *
 * @return The block's new lock.
 */
export function applyLockSelection(
	selection: BlockLockSelection,
	currentLock: BlockLock
): BlockLock {
	const edit = selection.edit ?? currentLock.edit;

	return {
		move: selection.move ?? !! currentLock.move,
		remove: selection.remove ?? !! currentLock.remove,
		...( edit !== undefined ? { edit } : {} ),
	};
}
