/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

export function complementaryAreas( state = {}, action ) {
	switch ( action.type ) {
		case 'SET_DEFAULT_COMPLEMENTARY_AREA': {
			const { scope, area } = action;

			// If there's already an area, don't overwrite it.
			if ( state[ scope ] ) {
				return state;
			}

			return {
				...state,
				[ scope ]: area,
			};
		}
		case 'ENABLE_COMPLEMENTARY_AREA': {
			const { scope, area } = action;
			return {
				...state,
				[ scope ]: area,
			};
		}
	}

	return state;
}

/**
 * Reducer for storing the name of the open modal, or null if no modal is open.
 *
 * @param {Object} state  Previous state.
 * @param {Object} action Action object containing the `name` of the modal
 *
 * @return {Object} Updated state
 */
export function activeModal( state = null, action ) {
	switch ( action.type ) {
		case 'OPEN_MODAL':
			return action.name;
		case 'CLOSE_MODAL':
			return null;
	}

	return state;
}

export default combineReducers( {
	complementaryAreas,
	activeModal,
} );
