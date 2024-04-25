/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { EDITOR_SETTINGS_DEFAULTS } from './defaults';

/**
 * Returns a post attribute value, flattening nested rendered content using its
 * raw value in place of its original object form.
 *
 * @param {*} value Original value.
 *
 * @return {*} Raw value.
 */
export function getPostRawValue( value ) {
	if ( value && 'object' === typeof value && 'raw' in value ) {
		return value.raw;
	}

	return value;
}

/**
 * Returns true if the two object arguments have the same keys, or false
 * otherwise.
 *
 * @param {Object} a First object.
 * @param {Object} b Second object.
 *
 * @return {boolean} Whether the two objects have the same keys.
 */
export function hasSameKeys( a, b ) {
	const keysA = Object.keys( a ).sort();
	const keysB = Object.keys( b ).sort();
	return (
		keysA.length === keysB.length &&
		keysA.every( ( key, index ) => keysB[ index ] === key )
	);
}

/**
 * Returns true if, given the currently dispatching action and the previously
 * dispatched action, the two actions are editing the same post property, or
 * false otherwise.
 *
 * @param {Object} action         Currently dispatching action.
 * @param {Object} previousAction Previously dispatched action.
 *
 * @return {boolean} Whether actions are updating the same post property.
 */
export function isUpdatingSamePostProperty( action, previousAction ) {
	return (
		action.type === 'EDIT_POST' &&
		hasSameKeys( action.edits, previousAction.edits )
	);
}

/**
 * Returns true if, given the currently dispatching action and the previously
 * dispatched action, the two actions are modifying the same property such that
 * undo history should be batched.
 *
 * @param {Object} action         Currently dispatching action.
 * @param {Object} previousAction Previously dispatched action.
 *
 * @return {boolean} Whether to overwrite present state.
 */
export function shouldOverwriteState( action, previousAction ) {
	if ( action.type === 'RESET_EDITOR_BLOCKS' ) {
		return ! action.shouldCreateUndoLevel;
	}

	if ( ! previousAction || action.type !== previousAction.type ) {
		return false;
	}

	return isUpdatingSamePostProperty( action, previousAction );
}

export function postId( state = null, action ) {
	switch ( action.type ) {
		case 'SET_EDITED_POST':
			return action.postId;
	}

	return state;
}

export function templateId( state = null, action ) {
	switch ( action.type ) {
		case 'SET_CURRENT_TEMPLATE_ID':
			return action.id;
	}

	return state;
}

export function postType( state = null, action ) {
	switch ( action.type ) {
		case 'SET_EDITED_POST':
			return action.postType;
	}

	return state;
}

/**
 * Reducer returning whether the post blocks match the defined template or not.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function template( state = { isValid: true }, action ) {
	switch ( action.type ) {
		case 'SET_TEMPLATE_VALIDITY':
			return {
				...state,
				isValid: action.isValid,
			};
	}

	return state;
}

/**
 * Reducer returning current network request state (whether a request to
 * the WP REST API is in progress, successful, or failed).
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function saving( state = {}, action ) {
	switch ( action.type ) {
		case 'REQUEST_POST_UPDATE_START':
		case 'REQUEST_POST_UPDATE_FINISH':
			return {
				pending: action.type === 'REQUEST_POST_UPDATE_START',
				options: action.options || {},
			};
	}

	return state;
}

/**
 * Reducer returning deleting post request state.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function deleting( state = {}, action ) {
	switch ( action.type ) {
		case 'REQUEST_POST_DELETE_START':
		case 'REQUEST_POST_DELETE_FINISH':
			return {
				pending: action.type === 'REQUEST_POST_DELETE_START',
			};
	}

	return state;
}

/**
 * Post Lock State.
 *
 * @typedef {Object} PostLockState
 *
 * @property {boolean}  isLocked       Whether the post is locked.
 * @property {?boolean} isTakeover     Whether the post editing has been taken over.
 * @property {?boolean} activePostLock Active post lock value.
 * @property {?Object}  user           User that took over the post.
 */

/**
 * Reducer returning the post lock status.
 *
 * @param {PostLockState} state  Current state.
 * @param {Object}        action Dispatched action.
 *
 * @return {PostLockState} Updated state.
 */
export function postLock( state = { isLocked: false }, action ) {
	switch ( action.type ) {
		case 'UPDATE_POST_LOCK':
			return action.lock;
	}

	return state;
}

/**
 * Post saving lock.
 *
 * When post saving is locked, the post cannot be published or updated.
 *
 * @param {PostLockState} state  Current state.
 * @param {Object}        action Dispatched action.
 *
 * @return {PostLockState} Updated state.
 */
export function postSavingLock( state = {}, action ) {
	switch ( action.type ) {
		case 'LOCK_POST_SAVING':
			return { ...state, [ action.lockName ]: true };

		case 'UNLOCK_POST_SAVING': {
			const { [ action.lockName ]: removedLockName, ...restState } =
				state;
			return restState;
		}
	}
	return state;
}

/**
 * Post autosaving lock.
 *
 * When post autosaving is locked, the post will not autosave.
 *
 * @param {PostLockState} state  Current state.
 * @param {Object}        action Dispatched action.
 *
 * @return {PostLockState} Updated state.
 */
export function postAutosavingLock( state = {}, action ) {
	switch ( action.type ) {
		case 'LOCK_POST_AUTOSAVING':
			return { ...state, [ action.lockName ]: true };

		case 'UNLOCK_POST_AUTOSAVING': {
			const { [ action.lockName ]: removedLockName, ...restState } =
				state;
			return restState;
		}
	}
	return state;
}

/**
 * Reducer returning the post editor setting.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function editorSettings( state = EDITOR_SETTINGS_DEFAULTS, action ) {
	switch ( action.type ) {
		case 'UPDATE_EDITOR_SETTINGS':
			return {
				...state,
				...action.settings,
			};
	}

	return state;
}

export function renderingMode( state = 'post-only', action ) {
	switch ( action.type ) {
		case 'SET_RENDERING_MODE':
			return action.mode;
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
		case 'SET_DEVICE_TYPE':
			return action.deviceType;
	}

	return state;
}

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

export default combineReducers( {
	postId,
	postType,
	templateId,
	saving,
	deleting,
	postLock,
	template,
	postSavingLock,
	editorSettings,
	postAutosavingLock,
	renderingMode,
	deviceType,
	removedPanels,
	blockInserterPanel,
	listViewPanel,
	listViewToggleRef,
	publishSidebarActive,
} );
