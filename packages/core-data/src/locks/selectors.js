/**
 * Internal dependencies
 */
import { iterateDescendants, iteratePath, hasConflictingLock } from './utils';

export function getPendingLockRequests( state ) {
	return state.locks.requests;
}

export function isLockAvailable( state, store, path, { exclusive } ) {
	path = [ store, ...path ];
	const locks = state.locks.tree;
	let node;

	// Validate all parents and the node itself
	for ( node of iteratePath( locks, path ) ) {
		if ( hasConflictingLock( { exclusive }, node.locks ) ) {
			return false;
		}
	}

	// Validate all nested nodes
	for ( const descendant of iterateDescendants( node ) ) {
		if ( hasConflictingLock( { exclusive }, descendant.locks ) ) {
			return false;
		}
	}

	return true;
}
