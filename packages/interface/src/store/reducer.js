/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

export function complementaryAreas( state = {}, action ) {
	switch ( action.type ) {
		case 'ENABLE_COMPLEMENTARY_AREA': {
			const { scope, area } = action;
			return {
				...state.scope,
				[ scope ]: area,
			};
		}
		case 'DISABLE_COMPLEMENTARY_AREA': {
			const { scope } = action;
			const newState = { ...state };
			delete newState[ scope ];
			return newState;
		}
	}
}

export default combineReducers( {
	complementaryAreas,
} );
