import type {
	BlockLock,
	BlockLockSelection,
	BlockLockState,
	SharedLockValue,
} from './types';

const LOCK_FEATURES = [ 'move', 'remove', 'edit' ] as const;

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

/**
 * Applies the lock features chosen in the modal to a block's saved lock.
 * Features left mixed or not offered keep the block's saved value, so a lock
 * inherited from a parent's template lock stays inherited.
 *
 * @param selection The lock features chosen in the modal.
 * @param savedLock The block's `lock` attribute.
 *
 * @return The block's new lock, or `undefined` when no feature is set.
 */
export function applyLockSelection(
	selection: BlockLockSelection,
	savedLock: BlockLock = {}
): BlockLock | undefined {
	const entries = LOCK_FEATURES.map( ( feature ) => [
		feature,
		selection[ feature ] ?? savedLock[ feature ],
	] ).filter( ( [ , value ] ) => value !== undefined );

	return entries.length > 0 ? Object.fromEntries( entries ) : undefined;
}

/**
 * Returns whether two locks set the same features to the same values.
 *
 * @param lock      A block lock.
 * @param savedLock The block's `lock` attribute.
 *
 * @return Whether the locks are the same.
 */
function isSameLock( lock: BlockLock = {}, savedLock: BlockLock = {} ) {
	return LOCK_FEATURES.every(
		( feature ) => lock[ feature ] === savedLock[ feature ]
	);
}

/**
 * Returns whether a block keeps its `templateLock` when the user leaves
 * "Apply to all blocks inside" untouched: when it has none, when it is a
 * `contentOnly` lock the modal can't express, or when its own lock is
 * unchanged.
 *
 * @param block   The block's saved lock attributes.
 * @param newLock The block's new lock.
 *
 * @return Whether the block keeps its `templateLock`.
 */
function keepsTemplateLock( block: BlockLockState, newLock?: BlockLock ) {
	return (
		! block.templateLock ||
		block.templateLock === 'contentOnly' ||
		isSameLock( newLock, block.lock )
	);
}

/**
 * Returns the `templateLock` attribute matching a block's new lock. A block
 * whose type doesn't support a template lock gets no attribute.
 *
 * @param block             The block's saved lock attributes.
 * @param newLock           The block's new lock.
 * @param applyTemplateLock Whether to apply the lock to inner blocks, or
 *                          `null` when the user left it untouched.
 *
 * @return The `templateLock` attribute, if any.
 */
function getTemplateLockAttribute(
	block: BlockLockState,
	newLock: BlockLock | undefined,
	applyTemplateLock: SharedLockValue
) {
	if ( ! block.supportsTemplateLock ) {
		return {};
	}

	if ( applyTemplateLock === null ) {
		return keepsTemplateLock( block, newLock )
			? {}
			: { templateLock: getTemplateLockValue( newLock ?? {} ) };
	}

	return {
		templateLock: applyTemplateLock
			? getTemplateLockValue( newLock ?? {} )
			: undefined,
	};
}

/**
 * Returns the attributes that apply the chosen lock features to a block.
 *
 * @param block             The block's saved lock attributes.
 * @param selection         The lock features chosen in the modal.
 * @param applyTemplateLock Whether to apply the lock to inner blocks, or
 *                          `null` when the user left it untouched.
 *
 * @return The block's new lock attributes.
 */
export function getLockAttributes(
	block: BlockLockState,
	selection: BlockLockSelection,
	applyTemplateLock: SharedLockValue
) {
	const lock = applyLockSelection( selection, block.lock );

	return {
		lock,
		...getTemplateLockAttribute( block, lock, applyTemplateLock ),
	};
}
