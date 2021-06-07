/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS } from './defaults';
import { MENU_ROOT } from '../components/navigation-sidebar/navigation-panel/constants';

/**
 * Reducer returning the user preferences.
 *
 * @param {Object}  state Current state.
 * @param {Object}  action Dispatched action.
 * @return {Object} Updated state.
 */
export const preferences = combineReducers( {
	features( state = PREFERENCES_DEFAULTS.features, action ) {
		switch ( action.type ) {
			case 'TOGGLE_FEATURE': {
				return {
					...state,
					[ action.feature ]: ! state[ action.feature ],
				};
			}
			default:
				return state;
		}
	},
} );

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
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function editedPost( state = {}, action ) {
	switch ( action.type ) {
		case 'SET_TEMPLATE':
		case 'SET_PAGE':
			return {
				type: 'wp_template',
				id: action.templateId,
				page: action.page,
			};
		case 'SET_TEMPLATE_PART':
			return {
				type: 'wp_template_part',
				id: action.templatePartId,
			};
	}

	return state;
}

/**
 * Reducer for information about the site's homepage.
 *
 * @param {Object} state Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function homeTemplateId( state, action ) {
	switch ( action.type ) {
		case 'SET_HOME_TEMPLATE':
			return action.homeTemplateId;
	}

	return state;
}

/**
 * Reducer for information about the navigation panel, such as its active menu
 * and whether it should be opened or closed.
 *
 * Note: this reducer interacts with the inserter and list view panels reducers
 * to make sure that only one of the three panels is open at the same time.
 *
 * @param {Object} state Current state.
 * @param {Object} action Dispatched action.
 */
export function navigationPanel(
	state = { menu: MENU_ROOT, isOpen: false },
	action
) {
	switch ( action.type ) {
		case 'SET_NAVIGATION_PANEL_ACTIVE_MENU':
			return {
				...state,
				menu: action.menu,
			};
		case 'OPEN_NAVIGATION_PANEL_TO_MENU':
			return {
				...state,
				isOpen: true,
				menu: action.menu,
			};
		case 'SET_IS_NAVIGATION_PANEL_OPENED':
			return {
				...state,
				isOpen: action.isOpen,
			};
		case 'SET_IS_LIST_VIEW_OPENED':
			return {
				...state,
				isOpen: action.isOpen ? false : state.isOpen,
			};
		case 'SET_IS_INSERTER_OPENED':
			return {
				...state,
				isOpen: action.value ? false : state.isOpen,
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
		case 'OPEN_NAVIGATION_PANEL_TO_MENU':
			return false;
		case 'SET_IS_NAVIGATION_PANEL_OPENED':
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
 * Note: this reducer interacts with the navigation and inserter panels reducers
 * to make sure that only one of the three panels is open at the same time.
 *
 * @param {Object} state Current state.
 * @param {Object} action Dispatched action.
 */
export function listViewPanel( state = false, action ) {
	switch ( action.type ) {
		case 'OPEN_NAVIGATION_PANEL_TO_MENU':
			return false;
		case 'SET_IS_NAVIGATION_PANEL_OPENED':
			return action.isOpen ? false : state;
		case 'SET_IS_INSERTER_OPENED':
			return action.value ? false : state;
		case 'SET_IS_LIST_VIEW_OPENED':
			return action.isOpen;
	}
	return state;
}

export default combineReducers( {
	preferences,
	deviceType,
	settings,
	editedPost,
	homeTemplateId,
	navigationPanel,
	blockInserterPanel,
	listViewPanel,
} );
