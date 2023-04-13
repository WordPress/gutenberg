/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer returning the editing canvas device type.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function deviceType( state = 'Desktop', action ) {
	switch ( action.type ) {
		case 'SET_PREVIEW_DEVICE_TYPE':
			return action.deviceType;
	}

	return state;
}

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
 * Reducer to set the block inserter panel open or closed.
 *
 * Note: this reducer interacts with the navigation and list view panels reducers
 * to make sure that only one of the three panels is open at the same time.
 *
 * @param {boolean|Object} state  Current state.
 * @param {Object}         action Dispatched action.
 */
export function blockInserterPanel( state = false, action ) {
	switch ( action.type ) {
		case 'SET_IS_LIST_VIEW_OPENED':
			return action.isOpen ? false : state;
		case 'SET_IS_INSERTER_OPENED':
			return action.value;
		case 'SET_CANVAS_MODE':
			return false;
	}
	return state;
}

/**
 * Reducer to set the list view panel open or closed.
 *
 * Note: this reducer interacts with the navigation and inserter panels reducers
 * to make sure that only one of the three panels is open at the same time.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 */
export function listViewPanel( state = false, action ) {
	switch ( action.type ) {
		case 'SET_IS_INSERTER_OPENED':
			return action.value ? false : state;
		case 'SET_IS_LIST_VIEW_OPENED':
			return action.isOpen;
		case 'SET_CANVAS_MODE':
			return false;
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
		case 'SET_CANVAS_MODE':
			return false;
	}
	return state;
}

/**
 * Reducer used to track the site editor canvas mode (edit or view).
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 */
function canvasMode( state = 'init', action ) {
	switch ( action.type ) {
		case 'SET_CANVAS_MODE':
			return action.mode;
	}

	return state;
}

export default combineReducers( {
	deviceType,
	settings,
	editedPost,
	blockInserterPanel,
	listViewPanel,
	saveViewPanel,
	canvasMode,
} );
