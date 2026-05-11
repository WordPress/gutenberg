/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer returning the settings.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function settings( state = {}, action ) {
	switch ( action.type ) {
		case 'UPDATE_SETTINGS':
			return {
				...state,
				...action.settings,
			};
	}

	return state;
}

/**
 * Reducer keeping track of the currently edited Post Type,
 * Post Id and the context provided to fill the content of the block editor.
 *
 * @param {Object} state  Current edited post.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function editedPost( state = {}, action ) {
	switch ( action.type ) {
		case 'SET_EDITED_POST':
			return {
				postType: action.postType,
				id: action.id,
				context: action.context,
			};
		case 'SET_EDITED_POST_CONTEXT':
			return {
				...state,
				context: action.context,
			};
	}

	return state;
}

/**
 * Reducer to set the save view panel open or closed.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 */
export function saveViewPanel( state = false, action ) {
	switch ( action.type ) {
		case 'SET_IS_SAVE_VIEW_OPENED':
			return action.isOpen;
	}
	return state;
}

function routes( state = [], action ) {
	switch ( action.type ) {
		case 'REGISTER_ROUTE':
			return [ ...state, action.route ];
		case 'UNREGISTER_ROUTE':
			return state.filter( ( route ) => route.name !== action.name );
	}

	return state;
}

export default combineReducers( {
	settings,
	editedPost,
	saveViewPanel,
	routes,
} );
