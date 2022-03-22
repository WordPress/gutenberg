/**
 * External dependencies
 */
import { omit, keys, isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS, EDITOR_SETTINGS_DEFAULTS } from './defaults';

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
	return isEqual( keys( a ), keys( b ) );
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
		case 'SETUP_EDITOR_STATE':
			return action.post.id;
	}

	return state;
}

export function postType( state = null, action ) {
	switch ( action.type ) {
		case 'SETUP_EDITOR_STATE':
			return action.post.type;
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
 * Reducer returning the user preferences.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function preferences( state = PREFERENCES_DEFAULTS, action ) {
	switch ( action.type ) {
		case 'ENABLE_PUBLISH_SIDEBAR':
			return {
				...state,
				isPublishSidebarEnabled: true,
			};

		case 'DISABLE_PUBLISH_SIDEBAR':
			return {
				...state,
				isPublishSidebarEnabled: false,
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

		case 'UNLOCK_POST_SAVING':
			return omit( state, action.lockName );
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

		case 'UNLOCK_POST_AUTOSAVING':
			return omit( state, action.lockName );
	}
	return state;
}

/**
 * Reducer returning whether the editor is ready to be rendered.
 * The editor is considered ready to be rendered once
 * the post object is loaded properly and the initial blocks parsed.
 *
 * @param {boolean} state
 * @param {Object}  action
 *
 * @return {boolean} Updated state.
 */
export function isReady( state = false, action ) {
	switch ( action.type ) {
		case 'SETUP_EDITOR_STATE':
			return true;

		case 'TEAR_DOWN_EDITOR':
			return false;
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

export default combineReducers( {
	postId,
	postType,
	preferences,
	saving,
	postLock,
	template,
	postSavingLock,
	isReady,
	editorSettings,
	postAutosavingLock,
} );
