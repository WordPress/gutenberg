import { combineReducers } from '@wordpress/data';
import type { Action, FormatType, State } from '../types';

/**
 * Reducer managing the format types
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function formatTypes(
	state: State[ 'formatTypes' ] = {},
	action: Action
) {
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
					{} as Record< string, FormatType >
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
