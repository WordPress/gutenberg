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

/**
 * Reducer managing per-block disabled format types.
 * State shape: { [blockName]: string[] }
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function disabledFormatTypesByBlock( state = {}, action ) {
	switch ( action.type ) {
		case 'DISABLE_FORMAT_TYPE_IN_BLOCK': {
			const { blockName, formatName } = action;
			const existing = state[ blockName ] || [];
			if ( existing.includes( formatName ) ) {
				return state;
			}
			return { ...state, [ blockName ]: [ ...existing, formatName ] };
		}
		case 'ENABLE_FORMAT_TYPE_IN_BLOCK': {
			const { blockName, formatName } = action;
			if ( ! state[ blockName ] ) {
				return state;
			}
			const filtered = state[ blockName ].filter(
				( name ) => name !== formatName
			);
			if ( filtered.length === 0 ) {
				const { [ blockName ]: _removed, ...rest } = state;
				return rest;
			}
			return { ...state, [ blockName ]: filtered };
		}
	}

	return state;
}

export default combineReducers( { formatTypes, disabledFormatTypesByBlock } );
