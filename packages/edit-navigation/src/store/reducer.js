/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer tracking whether the inserter is open.
 *
 * @param {boolean|Object} state        Current state.
 * @param {Object}         action       Dispatched action.
 * @param {string}         action.type  String indicating action type.
 * @param {boolean}        action.value Flag indicating whether the panel should be open/close.
 */
function blockInserterPanel( state = false, action ) {
	switch ( action.type ) {
		case 'SET_IS_INSERTER_OPENED':
			return action.value;
	}
	return state;
}

export default combineReducers( {
	blockInserterPanel,
} );
