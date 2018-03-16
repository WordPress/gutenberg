/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Reducer managing terms state. Keyed by taxonomy slug, the value is either
 * undefined (if no request has been made for given taxonomy), null (if a
 * request is in-flight for given taxonomy), or the array of terms for the
 * taxonomy.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function terms( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_TERMS':
			return {
				...state,
				[ action.taxonomy ]: action.terms,
			};

		case 'SET_REQUESTED':
			const { dataType, subType: taxonomy } = action;
			if ( dataType !== 'terms' || state.hasOwnProperty( taxonomy ) ) {
				return state;
			}

			return {
				...state,
				[ taxonomy ]: null,
			};
	}

	return state;
}

export default combineReducers( {
	terms,
} );
