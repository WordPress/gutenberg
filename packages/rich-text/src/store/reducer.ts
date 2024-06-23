/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { State } from '../types';
import type { AddFormatTypesAction, RemoveFormatTypesAction } from './actions';

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
	action: AddFormatTypesAction | RemoveFormatTypesAction
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
