/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

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
} );
