/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer returning a map of style IDs to style overrides.
 *
 * @param {Map}    state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Map} Updated state.
 */
export function styleOverrides( state = new Map(), action ) {
	switch ( action.type ) {
		case 'SET_STYLE_OVERRIDE':
			return new Map( state ).set( action.id, action.style );
		case 'DELETE_STYLE_OVERRIDE': {
			const newState = new Map( state );
			newState.delete( action.id );
			return newState;
		}
	}
	return state;
}

export default combineReducers( { styleOverrides } );
