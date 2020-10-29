/**
 * Internal dependencies
 */
import {
	iterateDescendants,
	iteratePath,
	hasConflictingLock,
	getNode,
} from './utils';

export function getPendingLockRequests( state ) {
	return state.locks.requests;
}

export function isLockAvailable( state, store, path, { exclusive } ) {
	path = [ store, ...path ];
	const locks = state.locks.tree;

	// Validate all parents and the node itself
	for ( const node of iteratePath( locks, path ) ) {
		if ( hasConflictingLock( { exclusive }, node.locks ) ) {
			return false;
		}
	}

	// iteratePath terminates early if path is unreachable, let's
	// re-fetch the node and check it exists in the tree.
	const node = getNode( locks, path );
	if ( ! node ) {
		return true;
	}

	// Validate all nested nodes
	for ( const descendant of iterateDescendants( node ) ) {
		if ( hasConflictingLock( { exclusive }, descendant.locks ) ) {
			return false;
		}
	}

	return true;
}
