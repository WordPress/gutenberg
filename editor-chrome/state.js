/**
 * External dependencies
 */
import optimist from 'redux-optimist';
import { combineReducers, applyMiddleware, createStore } from 'redux';
import refx from 'refx';
import { reduce, omit, flowRight, forOwn } from 'lodash';

/**
 * Internal dependencies
 */
import { combineUndoableReducers } from './utils/undoable-reducer';
import effects from './effects';

const isMobile = window.innerWidth < 782;
const renderedPostProps = new Set( [ 'guid', 'title', 'excerpt', 'content' ] );

/**
 * Undoable reducer returning the editor post state, including blocks parsed
 * from current HTML markup.
 *
 * Handles the following state keys:
 *  - edits: an object describing changes to be made to the current post, in
 *           the format accepted by the WP REST API
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export const editor = combineUndoableReducers( {
	edits( state = {}, action ) {
		switch ( action.type ) {
			case 'EDIT_POST':
			case 'SETUP_NEW_POST':
				return reduce( action.edits, ( result, value, key ) => {
					// Only assign into result if not already same value
					if ( value !== state[ key ] ) {
						// Avoid mutating original state by creating shallow
						// clone. Should only occur once per reduce.
						if ( result === state ) {
							result = { ...state };
						}

						result[ key ] = value;
					}

					return result;
				}, state );

			case 'CLEAR_POST_EDITS':
				// Don't return a new object if there's not any edits
				if ( ! Object.keys( state ).length ) {
					return state;
				}

				return {};
		}

		return state;
	},

	dirty( state = false, action ) {
		switch ( action.type ) {
			case 'REQUEST_POST_UPDATE_SUCCESS':
			case 'TRASH_POST_SUCCESS':
				return false;

			case 'UPDATE_BLOCK_ATTRIBUTES':
			case 'EDIT_POST':
			case 'MARK_DIRTY':
				return true;
		}

		return state;
	},
} );

/**
 * Reducer returning the last-known state of the current post, in the format
 * returned by the WP REST API.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export function currentPost( state = {}, action ) {
	switch ( action.type ) {
		case 'RESET_POST':
			return action.post;

		case 'UPDATE_POST':
			const post = { ...state };
			forOwn( action.edits, ( value, key ) => {
				if ( renderedPostProps.has( key ) ) {
					post[ key ] = { raw: value };
				} else {
					post[ key ] = value;
				}
			} );
			return post;
	}

	return state;
}

export function isSidebarOpened( state = ! isMobile, action ) {
	switch ( action.type ) {
		case 'TOGGLE_SIDEBAR':
			return ! state;
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

/**
 * Reducer returning current network request state (whether a request to the WP
 * REST API is in progress, successful, or failed).
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export function saving( state = {}, action ) {
	switch ( action.type ) {
		case 'REQUEST_POST_UPDATE':
			return {
				requesting: true,
				successful: false,
				error: null,
			};

		case 'REQUEST_POST_UPDATE_SUCCESS':
			return {
				requesting: false,
				successful: true,
				error: null,
			};

		case 'REQUEST_POST_UPDATE_FAILURE':
			return {
				requesting: false,
				successful: false,
				error: action.error,
			};
	}

	return state;
}

export function notices( state = {}, action ) {
	switch ( action.type ) {
		case 'CREATE_NOTICE':
			return {
				...state,
				[ action.notice.id ]: action.notice,
			};
		case 'REMOVE_NOTICE':
			if ( ! state.hasOwnProperty( action.noticeId ) ) {
				return state;
			}

			return omit( state, action.noticeId );
	}

	return state;
}

/**
 * Reducer returning current editor mode, either "visual" or "text".
 *
 * @param  {string} state  Current state
 * @param  {Object} action Dispatched action
 * @return {string}        Updated state
 */
export function mode( state = 'visual', action ) {
	switch ( action.type ) {
		case 'SWITCH_MODE':
			return action.mode;
	}

	return state;
}

/**
 * Creates a new instance of a Redux store.
 *
 * @return {Redux.Store} Redux store
 */
export function createReduxStore() {
	const reducer = optimist( combineReducers( {
		editor,
		currentPost,
		saving,
		notices,
		mode,
		isSidebarOpened,
		panel,
	} ) );

	const enhancers = [ applyMiddleware( refx( effects ) ) ];
	if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
		enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__() );
	}

	return createStore( reducer, flowRight( enhancers ) );
}

export default createReduxStore;
