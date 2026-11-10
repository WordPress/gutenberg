import { getNode, deepCopyLocksTreePath } from './utils';
import type { LocksAction, LocksState } from './types';

const DEFAULT_STATE: LocksState = {
	requests: [],
	tree: {
		locks: [],
		children: {},
	},
};

/**
 * Reducer returning locks.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export default function locks(
	state: LocksState = DEFAULT_STATE,
	action: LocksAction
): LocksState {
	switch ( action.type ) {
		case 'ENQUEUE_LOCK_REQUEST': {
			const { request } = action;
			return {
				...state,
				requests: [ request, ...state.requests ],
			};
		}
		case 'GRANT_LOCK_REQUEST': {
			const { lock, request } = action;
			const { store, path } = request;
			const storePath = [ store, ...path ];

			const newTree = deepCopyLocksTreePath( state.tree, storePath );
			// The copy above holds every node on the path.
			const node = getNode( newTree, storePath )!;
			node.locks = [ ...node.locks, lock ];

			return {
				...state,
				requests: state.requests.filter( ( r ) => r !== request ),
				tree: newTree,
			};
		}
		case 'RELEASE_LOCK': {
			const { lock } = action;
			const storePath = [ lock.store, ...lock.path ];

			const newTree = deepCopyLocksTreePath( state.tree, storePath );
			// The copy above holds every node on the path.
			const node = getNode( newTree, storePath )!;
			node.locks = node.locks.filter( ( l ) => l !== lock );

			return {
				...state,
				tree: newTree,
			};
		}
	}

	return state;
}
