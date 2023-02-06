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

export default combineReducers( {
	complementaryAreas,
} );
