/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Reducer returning the categories list.
 *
 * @param {Object}  state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {string} Updated state.
 */
function categories( state = null, action ) {
	switch ( action.type ) {
		case 'RECEIVE_CATEGORIES':
			return [ ...action.categories ];
	}

	return state;
}

/**
 * Reducer returning requested state, tracking whether requests have been
 * issued for a given data type.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Action object.
 *
 * @return {Object} Next state.
 */
function requested( state = {}, action ) {
	switch ( action.type ) {
		case 'SET_REQUESTED':
			return {
				...state,
				[ action.dataType ]: true,
			};
	}

	return state;
}

export default combineReducers( {
	categories,
	requested,
} );
