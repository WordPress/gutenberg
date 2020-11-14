/**
 * Internal dependencies
 */
import { getNode, deepCopyLocksTreePath } from './utils';

const DEFAULT_STATE = {
	requests: [],
	tree: {
		locks: [],
		children: {},
	},
};

/**
 * Reducer returning locks.
 *
 * @param  {Object} state  Current state.
 * @param  {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function locks( state = DEFAULT_STATE, action ) {
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
			const node = getNode( newTree, storePath );
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
			const node = getNode( newTree, storePath );
			node.locks = node.locks.filter( ( l ) => l !== lock );

			return {
				...state,
				tree: newTree,
			};
		}
	}

	return state;
}

export default locks;
