/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal to edit-navigation package.
 *
 * Stores menuItemId -> clientId mapping which is necessary for saving the navigation.
 *
 * @param {Object} state Redux state
 * @param {Object} action Redux action
 * @return {Object} Updated state
 */
export function mapping( state, action ) {
	const { type, postId, ...rest } = action;
	if ( type === 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING' ) {
		return { ...state, [ postId ]: rest.mapping };
	}

	return state || {};
}

/**
 * Internal to edit-navigation package.
 *
 * Enables serializeProcessing action wrapper by storing the underlying execution
 * state and any pending actions.
 *
 * @param {Object} state Redux state
 * @param {Object} action Redux action
 * @return {Object} Updated state
 */
export function processingQueue( state, action ) {
	const { type, postId, ...rest } = action;
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
			const postState = { ...state[ postId ] };
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
