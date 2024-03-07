/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

export function bindingsSources( state = {}, action ) {
	if ( action.type === 'REGISTER_BINDINGS_SOURCE' ) {
		return {
			...state,
			[ action.name ]: {
				label: action.label,
				connect: action.connect,
			},
		};
	}
	return state;
}

const reducer = combineReducers( {
	bindingsSources,
} );

export default reducer;
