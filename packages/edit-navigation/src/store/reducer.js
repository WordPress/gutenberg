/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

function mapping( state, { type, postId, ...rest } ) {
	if ( type === 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING' ) {
		state[ postId ] = rest.mapping;
	}

	return state || {};
}

function processingQueue( state, { type, postId, ...rest } ) {
	switch ( type ) {
		case 'START_PROCESSING_POST':
			state[ postId ] = {
				...state[ postId ],
				inProgress: true,
			};
			break;
		case 'FINISH_PROCESSING_POST':
			state[ postId ] = {
				...state[ postId ],
				inProgress: false,
				pendingActions:
					state[ postId ]?.pendingActions?.filter(
						( item ) => item !== rest.action
					) || [],
			};
			break;
		case 'ENQUEUE_AFTER_PROCESSING':
			const pendingActions = state[ postId ]?.pendingActions || [];
			if ( ! pendingActions.includes( rest.action ) ) {
				state[ postId ] = {
					...state[ postId ],
					pendingActions: [ ...pendingActions, rest.action ],
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
