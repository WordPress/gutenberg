/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer managing the format types
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function formatTypes( state = {}, action ) {
	switch ( action.type ) {
		case 'ADD_FORMAT_TYPES':
			return {
				...state,
				// Key format types by their name.
				...action.formatTypes.reduce(
					( newFormatTypes, type ) => ( {
						...newFormatTypes,
						[ type.name ]: type,
					} ),
					{}
				),
			};
		case 'REMOVE_FORMAT_TYPES':
			return Object.fromEntries(
				Object.entries( state ).filter(
					( [ key ] ) => ! action.names.includes( key )
				)
			);
	}

	return state;
}

export default combineReducers( { formatTypes } );
