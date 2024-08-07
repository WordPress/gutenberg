/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Controls the open state of the widget areas.
 *
 * @param {Object} state  Redux state.
 * @param {Object} action Redux action.
 *
 * @return {Array} Updated state.
 */
export function widgetAreasOpenState( state = {}, action ) {
	const { type } = action;
	switch ( type ) {
		case 'SET_WIDGET_AREAS_OPEN_STATE': {
			return action.widgetAreasOpenState;
		}
		case 'SET_IS_WIDGET_AREA_OPEN': {
			const { clientId, isOpen } = action;
			return {
				...state,
				[ clientId ]: isOpen,
			};
		}
		default: {
			return state;
		}
	}
}

/**
 * Reducer to set the block inserter panel open or closed.
 *
 * Note: this reducer interacts with the list view panel reducer
 * to make sure that only one of the two panels is open at the same time.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 */
export function blockInserterPanel( state = false, action ) {
	switch ( action.type ) {
		case 'SET_IS_LIST_VIEW_OPENED':
			return action.isOpen ? false : state;
		case 'SET_IS_INSERTER_OPENED':
			return action.value;
	}
	return state;
}

/**
 * Reducer to set the list view panel open or closed.
 *
 * Note: this reducer interacts with the inserter panel reducer
 * to make sure that only one of the two panels is open at the same time.
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
	}
	return state;
}

/**
 * This reducer does nothing aside initializing a ref to the list view toggle.
 * We will have a unique ref per "editor" instance.
 *
 * @param {Object} state
 * @return {Object} Reference to the list view toggle button.
 */
export function listViewToggleRef( state = { current: null } ) {
	return state;
}

/**
 * This reducer does nothing aside initializing a ref to the inserter sidebar toggle.
 * We will have a unique ref per "editor" instance.
 *
 * @param {Object} state
 * @return {Object} Reference to the inserter sidebar toggle button.
 */
export function inserterSidebarToggleRef( state = { current: null } ) {
	return state;
}

export default combineReducers( {
	blockInserterPanel,
	inserterSidebarToggleRef,
	listViewPanel,
	listViewToggleRef,
	widgetAreasOpenState,
} );
