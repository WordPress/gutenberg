/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer keeping track of selected menu ID.
 *
 * @param {number} state  Current state.
 * @param {Object} action Dispatched action.
 * @return {Object} Updated state.
 */
export function selectedMenuId( state = null, action ) {
	switch ( action.type ) {
		case 'SET_SELECTED_MENU_ID':
			return action.menuId;
	}

	return state;
}

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
	selectedMenuId,
	blockInserterPanel,
} );
