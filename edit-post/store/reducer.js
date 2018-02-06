/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { get, omit } from 'lodash';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS } from './defaults';

/**
 * Reducer returning the user preferences.
 *
 * @param {Object}  state                 Current state.
 * @param {string}  state.mode            Current editor mode, either "visual" or "text".
 * @param {boolean} state.isSidebarOpened Whether the sidebar is opened or closed.
 * @param {Object}  state.panels          The state of the different sidebar panels.
 * @param {Object}  action                Dispatched action.
 *
 * @return {string} Updated state.
 */
export function preferences( state = PREFERENCES_DEFAULTS, action ) {
	switch ( action.type ) {
		case 'OPEN_GENERAL_SIDEBAR':
			const activeSidebarPanel = action.panel ? action.panel : state.activeSidebarPanel[ action.sidebar ];
			return {
				...state,
				activeGeneralSidebar: action.sidebar,
				activeSidebarPanel: {
					...state.activeSidebarPanel,
					[ action.sidebar ]: activeSidebarPanel,
				},
			};
		case 'SET_GENERAL_SIDEBAR_ACTIVE_PANEL':
			return {
				...state,
				activeSidebarPanel: {
					...state.activeSidebarPanel,
					[ action.sidebar ]: action.panel,
				},
			};
		case 'CLOSE_GENERAL_SIDEBAR':
			return {
				...state,
				activeGeneralSidebar: null,
			};
		case 'TOGGLE_GENERAL_SIDEBAR_EDITOR_PANEL':
			return {
				...state,
				panels: {
					...state.panels,
					[ action.panel ]: ! get( state, [ 'panels', action.panel ], false ),
				},
			};
		case 'SET_VIEWPORT_TYPE':
			return {
				...state,
				viewportType: action.viewportType,
			};
		case 'UPDATE_MOBILE_STATE':
			if ( action.isMobile ) {
				return {
					...state,
					viewportType: 'mobile',
					activeGeneralSidebar: null,
				};
			}
			return {
				...state,
				viewportType: 'desktop',
			};
		case 'SWITCH_MODE':
			return {
				...state,
				editorMode: action.mode,
			};
		case 'TOGGLE_FEATURE':
			return {
				...state,
				features: {
					...state.features,
					[ action.feature ]: ! state.features[ action.feature ],
				},
			};
		case 'SERIALIZE':
			return omit( state, [ 'sidebars.mobile', 'sidebars.publish' ] );
	}

	return state;
}

export function panel( state = 'document', action ) {
	switch ( action.type ) {
		case 'SET_ACTIVE_PANEL':
			return action.panel;
	}

	return state;
}

export function publishSidebarActive( state = false, action ) {
	switch ( action.type ) {
		case 'OPEN_PUBLISH_SIDEBAR':
			return true;
		case 'CLOSE_PUBLISH_SIDEBAR':
			return false;
		case 'TOGGLE_PUBLISH_SIDEBAR':
			return ! state;
	}
	return state;
}

export function mobile( state = false, action ) {
	if ( action.type === 'UPDATE_MOBILE_STATE' ) {
		return action.isMobile;
	}
	return state;
}

export default combineReducers( {
	preferences,
	panel,
	publishSidebarActive,
	mobile,
} );
