/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

export function mapping( state, { type, postId, ...rest } ) {
	if ( type === 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING' ) {
		return { ...state, [ postId ]: rest.mapping };
	}

	return state || {};
}

export function processingQueue( state, { type, postId, ...rest } ) {
	switch ( type ) {
		case 'START_PROCESSING_POST':
			return {
				...state,
				[ postId ]: {
					...state[ postId ],
					inProgress: true,
				},
			};

		case 'FINISH_PROCESSING_POST':
			return {
				...state,
				[ postId ]: {
					...state[ postId ],
					inProgress: false,
				},
			};

		case 'POP_PENDING_ACTION':
			const postState = state[ postId ] || {};
			if ( 'pendingActions' in postState ) {
				postState.pendingActions = postState.pendingActions?.filter(
					( item ) => item !== rest.action
				);
			}
			return {
				...state,
				[ postId ]: postState,
			};

		case 'ENQUEUE_AFTER_PROCESSING':
			const pendingActions = state[ postId ]?.pendingActions || [];
			if ( ! pendingActions.includes( rest.action ) ) {
				return {
					...state,
					[ postId ]: {
						...state[ postId ],
						pendingActions: [ ...pendingActions, rest.action ],
					},
				};
			}
			break;
	}

	return state || {};
}

export default combineReducers( {
	mapping,
	processingQueue,
} );
