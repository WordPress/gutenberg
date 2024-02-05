/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer tracking whether a filter summary should open on mount.
 *
 * @param {boolean} state
 * @param {Object}  action
 *
 * @return {boolean} Updated state.
 */
function openFilterOnMount( state = null, action ) {
	switch ( action.type ) {
		case 'SET_OPEN_FILTER_ON_MOUNT':
			return action.filterField;
	}
	return state;
}

export default combineReducers( {
	openFilterOnMount,
} );
