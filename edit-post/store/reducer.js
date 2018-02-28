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

const locations = [
	'normal',
	'side',
	'advanced',
];

const defaultMetaBoxState = locations.reduce( ( result, key ) => {
	result[ key ] = {
		isActive: false,
	};

	return result;
}, {} );

/**
 * Reducer keeping track of the meta boxes isSaving state.
 * A "true" value means the meta boxes saving request is in-flight.
 *
 *
 * @param {boolean}  state   Previous state.
 * @param {Object}   action  Action Object.
 * @return {Object}         Updated state.
 */
export function isSavingMetaBoxes( state = false, action ) {
	switch ( action.type ) {
		case 'REQUEST_META_BOX_UPDATES':
			return true;
		case 'META_BOX_UPDATES_SUCCESS':
			return false;
		default:
			return state;
	}
}

/**
 * Reducer keeping track of the state of each meta box location.
 * This includes:
 *  - isActive: Whether the location is active or not.
 *  - data: The last saved form data for this location.
 *    This is used to check whether the form is dirty
 *    before leaving the page.
 *
 * @param {boolean}  state   Previous state.
 * @param {Object}   action  Action Object.
 * @return {Object}         Updated state.
 */
export function metaBoxes( state = defaultMetaBoxState, action ) {
	switch ( action.type ) {
		case 'INITIALIZE_META_BOX_STATE':
			return locations.reduce( ( newState, location ) => {
				newState[ location ] = {
					...state[ location ],
					isActive: action.metaBoxes[ location ],
				};
				return newState;
			}, { ...state } );
		case 'META_BOX_SET_SAVED_DATA':
			return locations.reduce( ( newState, location ) => {
				newState[ location ] = {
					...state[ location ],
					data: action.dataPerLocation[ location ],
				};
				return newState;
			}, { ...state } );
		default:
			return state;
	}
}

export default combineReducers( {
	preferences,
	panel,
	publishSidebarActive,
	metaBoxes,
	isSavingMetaBoxes,
} );
