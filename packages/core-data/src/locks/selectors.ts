import {
	iterateDescendants,
	iteratePath,
	hasConflictingLock,
	getNode,
} from './utils';
import type { LockPath, LockRequest, LocksState } from './types';

export function getPendingLockRequests( state: LocksState ): LockRequest[] {
	return state.requests;
}

export function isLockAvailable(
	state: LocksState,
	store: string,
	path: LockPath,
	{ exclusive }: { exclusive: boolean }
): boolean {
	const storePath = [ store, ...path ];
	const locks = state.tree;

	// Validate all parents and the node itself
	for ( const node of iteratePath( locks, storePath ) ) {
		if ( hasConflictingLock( { exclusive }, node.locks ) ) {
			return false;
		}
	}

	// iteratePath terminates early if path is unreachable, let's
	// re-fetch the node and check it exists in the tree.
	const node = getNode( locks, storePath );
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
