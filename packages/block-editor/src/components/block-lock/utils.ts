import { isShallowEqual } from '@wordpress/is-shallow-equal';
import type { BlockLock, SharedLockValue } from './types';

/**
 * Returns a block's lock with the chosen options applied. Returns the saved
 * lock itself when no value changes, so the block isn't marked as updated.
 *
 * @param savedLock  The block's saved lock.
 * @param chosenLock The lock options that aren't mixed.
 *
 * @return The block's new lock.
 */
export function getNewLock(
	savedLock: BlockLock | undefined,
	chosenLock: BlockLock
): BlockLock | undefined {
	const newLock = { ...savedLock, ...chosenLock };
	return isShallowEqual( newLock, savedLock ?? {} ) ? savedLock : newLock;
}

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
 * @return `true` when every value is true, `false` when none is or there are
 *         no values, and `null` when the values differ.
 */
export function getSharedLockValue( values: boolean[] ): SharedLockValue {
	if ( values.length > 0 && values.every( Boolean ) ) {
		return true;
	}

	return values.some( Boolean ) ? null : false;
}
