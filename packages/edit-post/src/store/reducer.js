/**
 * External dependencies
 */
import { flow, get, includes, omit, union, without } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS } from './defaults';

/**
 * Higher-order reducer creator which provides the given initial state for the
 * original reducer.
 *
 * @param {*} initialState Initial state to provide to reducer.
 *
 * @return {Function} Higher-order reducer.
 */
const createWithInitialState = ( initialState ) => ( reducer ) => {
	return ( state = initialState, action ) => reducer( state, action );
};

/**
 * Reducer returning the user preferences.
 *
 * @param {Object}  state                           Current state.
 * @param {string}  state.mode                      Current editor mode, either
 *                                                  "visual" or "text".
 * @param {boolean} state.isGeneralSidebarDismissed Whether general sidebar is
 *                                                  dismissed. False by default
 *                                                  or when closing general
 *                                                  sidebar, true when opening
 *                                                  sidebar.
 * @param {boolean} state.isSidebarOpened           Whether the sidebar is
 *                                                  opened or closed.
 * @param {Object}  state.panels                    The state of the different
 *                                                  sidebar panels.
 * @param {Object}  action                          Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const preferences = flow( [
	combineReducers,
	createWithInitialState( PREFERENCES_DEFAULTS ),
] )( {
	panels( state, action ) {
		switch ( action.type ) {
			case 'TOGGLE_PANEL_ENABLED': {
				const { panelName } = action;
				return {
					...state,
					[ panelName ]: {
						...state[ panelName ],
						enabled: ! get( state, [ panelName, 'enabled' ], true ),
					},
				};
			}

			case 'TOGGLE_PANEL_OPENED': {
				const { panelName } = action;
				const isOpen =
					state[ panelName ] === true ||
					get( state, [ panelName, 'opened' ], false );
				return {
					...state,
					[ panelName ]: {
						...state[ panelName ],
						opened: ! isOpen,
					},
				};
			}
		}

		return state;
	},
	editorMode( state, action ) {
		if ( action.type === 'SWITCH_MODE' ) {
			return action.mode;
		}

		return state;
	},
	hiddenBlockTypes( state, action ) {
		switch ( action.type ) {
			case 'SHOW_BLOCK_TYPES':
				return without( state, ...action.blockNames );

			case 'HIDE_BLOCK_TYPES':
				return union( state, action.blockNames );
		}

		return state;
	},
	preferredStyleVariations( state, action ) {
		switch ( action.type ) {
			case 'UPDATE_PREFERRED_STYLE_VARIATIONS': {
				if ( ! action.blockName ) {
					return state;
				}
				if ( ! action.blockStyle ) {
					return omit( state, [ action.blockName ] );
				}
				return {
					...state,
					[ action.blockName ]: action.blockStyle,
				};
			}
		}
		return state;
	},
} );

/**
 * Reducer storing the list of all programmatically removed panels.
 *
 * @param {Array}  state  Current state.
 * @param {Object} action Action object.
 *
 * @return {Array} Updated state.
 */
export function removedPanels( state = [], action ) {
	switch ( action.type ) {
		case 'REMOVE_PANEL':
			if ( ! includes( state, action.panelName ) ) {
				return [ ...state, action.panelName ];
			}
	}

	return state;
}

/**
 * Reducer for storing the name of the open modal, or null if no modal is open.
 *
 * @param {Object} state  Previous state.
 * @param {Object} action Action object containing the `name` of the modal
 *
 * @return {Object} Updated state
 */
export function activeModal( state = null, action ) {
	switch ( action.type ) {
		case 'OPEN_MODAL':
			return action.name;
		case 'CLOSE_MODAL':
			return null;
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

/**
 * Reducer keeping track of the meta boxes isSaving state.
 * A "true" value means the meta boxes saving request is in-flight.
 *
 *
 * @param {boolean} state  Previous state.
 * @param {Object}  action Action Object.
 *
 * @return {Object} Updated state.
 */
export function isSavingMetaBoxes( state = false, action ) {
	switch ( action.type ) {
		case 'REQUEST_META_BOX_UPDATES':
			return true;
		case 'META_BOX_UPDATES_SUCCESS':
		case 'META_BOX_UPDATES_FAILURE':
			return false;
		default:
			return state;
	}
}

/**
 * Reducer keeping track of the meta boxes per location.
 *
 * @param {boolean} state  Previous state.
 * @param {Object}  action Action Object.
 *
 * @return {Object} Updated state.
 */
export function metaBoxLocations( state = {}, action ) {
	switch ( action.type ) {
		case 'SET_META_BOXES_PER_LOCATIONS':
			return action.metaBoxesPerLocation;
	}

	return state;
}

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
 * Reducer tracking whether the inserter is open.
 *
 * @param {boolean} state
 * @param {Object}  action
 */
function isEditingTemplate( state = false, action ) {
	switch ( action.type ) {
		case 'SET_IS_EDITING_TEMPLATE':
			return action.value;
	}
	return state;
}

/**
 * Reducer tracking whether meta boxes are initialized.
 *
 * @param {boolean} state
 * @param {Object}  action
 *
 * @return {boolean} Updated state.
 */
function metaBoxesInitialized( state = false, action ) {
	switch ( action.type ) {
		case 'META_BOXES_INITIALIZED':
			return true;
	}
	return state;
}

const metaBoxes = combineReducers( {
	isSaving: isSavingMetaBoxes,
	locations: metaBoxLocations,
	initialized: metaBoxesInitialized,
} );

export default combineReducers( {
	activeModal,
	metaBoxes,
	preferences,
	publishSidebarActive,
	removedPanels,
	deviceType,
	blockInserterPanel,
	listViewPanel,
	isEditingTemplate,
} );
