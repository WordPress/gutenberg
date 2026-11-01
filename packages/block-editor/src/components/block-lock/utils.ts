import type { BlockLock, SharedLockValue } from './types';

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
