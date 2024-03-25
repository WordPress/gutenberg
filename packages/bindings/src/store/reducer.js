/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';
/**
 * Internal dependencies
 */

export function sources( state = {}, action ) {
	if ( action.type === 'REGISTER_BINDINGS_SOURCE' ) {
		const source = { ...action };
		delete source.type;
		delete source.name;

		return {
			...state,
			[ action.name ]: source,
		};
	}
	return state;
}

export function connections( state = {}, action ) {
	switch ( action.type ) {
		case 'REGISTER_BINDINGS_CONNECTION': {
			const { key, type, ...rest } = action;
			return {
				...state,
				[ key ]: { ...rest },
			};
		}

		case 'UPDATE_BINDINGS_CONNECTION': {
			const { type, key, ...updates } = action;
			return {
				...state,
				[ key ]: {
					...state[ key ],
					...updates,
				},
			};
		}
	}

	return state;
}

const reducer = combineReducers( {
	sources,
	connections,
} );

export default reducer;
