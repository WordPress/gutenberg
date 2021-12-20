/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer tracking whether the inserter is open.
 *
 * @param {boolean|Object} state
 * @param {Object}         action
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
