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
		case 'TOGGLE_SIDEBAR':
			return {
				...state,
				sidebars: {
					...state.sidebars,
					[ action.sidebar ]: action.forcedValue !== undefined ? action.forcedValue : ! state.sidebars[ action.sidebar ],
				},
			};
		case 'TOGGLE_SIDEBAR_PANEL':
			return {
				...state,
				panels: {
					...state.panels,
					[ action.panel ]: ! get( state, [ 'panels', action.panel ], false ),
				},
			};
		case 'SWITCH_MODE':
			return {
				...state,
				mode: action.mode,
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

export function mobile( state = false, action ) {
	if ( action.type === 'UPDATE_MOBILE_STATE' ) {
		return action.isMobile;
	}
	return state;
}

export default combineReducers( {
	preferences,
	panel,
	mobile,
} );
