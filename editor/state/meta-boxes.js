/**
 * External dependencies
 */
import { reduce } from 'lodash';
import createSelector from 'rememo';

/**
 * Supported meta box locations.
 *
 * @type {Array}
 */
const LOCATIONS = [
	'normal',
	'side',
];

/**
 * Default reducer state.
 *
 * @type {Object}
 */
const DEFAULT_STATE = LOCATIONS.reduce( ( result, key ) => {
	result[ key ] = {
		isActive: false,
		isDirty: false,
		isUpdating: false,
	};

	return result;
}, {} );

/**
 * Reducer
 */

export default function( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case 'INITIALIZE_META_BOX_STATE':
			return LOCATIONS.reduce( ( newState, location ) => {
				newState[ location ] = {
					...state[ location ],
					isLoaded: false,
					isActive: action.metaBoxes[ location ],
				};
				return newState;
			}, { ...state } );
		case 'META_BOX_LOADED':
			return {
				...state,
				[ action.location ]: {
					...state[ action.location ],
					isLoaded: true,
					isUpdating: false,
					isDirty: false,
				},
			};
		case 'HANDLE_META_BOX_RELOAD':
			return {
				...state,
				[ action.location ]: {
					...state[ action.location ],
					isUpdating: false,
					isDirty: false,
				},
			};
		case 'REQUEST_META_BOX_UPDATES':
			return action.locations.reduce( ( newState, location ) => {
				newState[ location ] = {
					...state[ location ],
					isUpdating: true,
					isDirty: false,
				};
				return newState;
			}, { ...state } );
		case 'META_BOX_STATE_CHANGED':
			return {
				...state,
				[ action.location ]: {
					...state[ action.location ],
					isDirty: action.hasChanged,
				},
			};
		default:
			return state;
	}
}

/**
 * Action creators
 */

/**
 * Returns an action object used to check the state of meta boxes at a location.
 *
 * This should only be fired once to initialize meta box state. If a meta box
 * area is empty, this will set the store state to indicate that React should
 * not render the meta box area.
 *
 * Example: initialMetaBoxState = { side: true, normal: false }
 * This indicates that the sidebar has a meta box but the normal area does not.
 *
 * @param {Object} initialMetaBoxState Whether meta box locations are active.
 *
 * @return {Object} Action object
 */
export function initializeMetaBoxState( initialMetaBoxState ) {
	return {
		type: 'INITIALIZE_META_BOX_STATE',
		metaBoxes: initialMetaBoxState,
	};
}

/**
 * Returns an action object used to signify that a meta box finished reloading.
 *
 * @param {String} location Location of meta box: 'normal', 'side'.
 *
 * @return {Object} Action object
 */
export function handleMetaBoxReload( location ) {
	return {
		type: 'HANDLE_META_BOX_RELOAD',
		location,
	};
}

/**
 * Returns an action object used to signify that a meta box finished loading.
 *
 * @param {String} location Location of meta box: 'normal', 'side'.
 *
 * @return {Object} Action object
 */
export function metaBoxLoaded( location ) {
	return {
		type: 'META_BOX_LOADED',
		location,
	};
}

/**
 * Returns an action object used to request meta box update.
 *
 * @param {Array} locations Locations of meta boxes: ['normal', 'side' ].
 *
 * @return {Object}     Action object
 */
export function requestMetaBoxUpdates( locations ) {
	return {
		type: 'REQUEST_META_BOX_UPDATES',
		locations,
	};
}

/**
 * Returns an action object used to set meta box state changed.
 *
 * @param {String}  location   Location of meta box: 'normal', 'side'.
 * @param {Boolean} hasChanged Whether the meta box has changed.
 *
 * @return {Object} Action object
 */
export function metaBoxStateChanged( location, hasChanged ) {
	return {
		type: 'META_BOX_STATE_CHANGED',
		location,
		hasChanged,
	};
}

/**
 * Selectors
 */

/**
 * Returns the state of legacy meta boxes.
 *
 * @param  {Object}  state Global application state
 * @return {Object}        State of meta boxes
 */
export function getMetaBoxes( state ) {
	return state.metaBoxes;
}

/**
 * Returns the state of legacy meta boxes.
 *
 * @param  {Object} state    Global application state
 * @param  {String} location Location of the meta box.
 * @return {Object}          State of meta box at specified location.
 */
export function getMetaBox( state, location ) {
	return getMetaBoxes( state )[ location ];
}

/**
 * Returns a list of dirty meta box locations.
 *
 * @param  {Object} state Global application state
 * @return {Array}        Array of locations for dirty meta boxes.
 */
export const getDirtyMetaBoxes = createSelector(
	( state ) => {
		return reduce( getMetaBoxes( state ), ( result, metaBox, location ) => {
			return metaBox.isDirty && metaBox.isActive ?
				[ ...result, location ] :
				result;
		}, [] );
	},
	( state ) => state.metaBoxes,
);

/**
 * Returns the dirty state of legacy meta boxes.
 *
 * Checks whether the entire meta box state is dirty. So if a sidebar is dirty,
 * but a normal area is not dirty, this will overall return dirty.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether state is dirty. True if dirty, false if not.
 */
export const isMetaBoxStateDirty = ( state ) => getDirtyMetaBoxes( state ).length > 0;
