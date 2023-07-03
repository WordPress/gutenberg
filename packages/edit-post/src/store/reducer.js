/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

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
			if ( ! state.includes( action.panelName ) ) {
				return [ ...state, action.panelName ];
			}
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

function mergeMetaboxes( metaboxes = [], newMetaboxes ) {
	const mergedMetaboxes = [ ...metaboxes ];
	for ( const metabox of newMetaboxes ) {
		const existing = mergedMetaboxes.findIndex(
			( box ) => box.id === metabox.id
		);
		if ( existing !== -1 ) {
			mergedMetaboxes[ existing ] = metabox;
		} else {
			mergedMetaboxes.push( metabox );
		}
	}
	return mergedMetaboxes;
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
		case 'SET_META_BOXES_PER_LOCATIONS': {
			const newState = { ...state };
			for ( const [ location, metaboxes ] of Object.entries(
				action.metaBoxesPerLocation
			) ) {
				newState[ location ] = mergeMetaboxes(
					newState[ location ],
					metaboxes
				);
			}
			return newState;
		}
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
 * Reducer tracking whether template editing is on or off.
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
	metaBoxes,
	publishSidebarActive,
	removedPanels,
	deviceType,
	blockInserterPanel,
	listViewPanel,
	isEditingTemplate,
} );
