/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

function processing( state, { type, menuId, ...rest } ) {
	switch ( type ) {
		case 'START_PROCESSING_MENU_ITEMS':
			state[ menuId ] = {
				...state[ menuId ],
				inProgress: true,
			};
			break;
		case 'FINISH_PROCESSING_MENU_ITEMS':
			state[ menuId ] = {
				...state[ menuId ],
				inProgress: false,
			};
			break;
		case 'ENQUEUE_AFTER_PROCESSING':
			const pendingActions = state[ menuId ]?.pendingActions || [];
			if ( ! pendingActions.includes( rest.action ) ) {
				state[ menuId ] = {
					...state[ menuId ],
					pendingActions: [ ...pendingActions, rest.action ],
				};
			}
			break;
	}

	return state || {};
}

export default combineReducers( {
	processing,
} );
