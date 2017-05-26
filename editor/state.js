/**
 * External dependencies
 */
import { combineReducers, applyMiddleware, createStore } from 'redux';
import refx from 'refx';
import { keyBy, last, omit, without, flowRight } from 'lodash';

/**
 * Internal dependencies
 */
import { combineUndoableReducers } from './utils/undoable-reducer';
import effects from './effects';

/**
 * Undoable reducer returning the editor post state, including blocks parsed
 * from current HTML markup.
 *
 * Handles the following state keys:
 *  - edits: an object describing changes to be made to the current post, in
 *           the format accepted by the WP REST API
 *  - blocksByUid: post content blocks keyed by UID
 *  - blockOrder: list of block UIDs in order
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
				return {
					...state,
					...action.edits,
				};
		}

		return state;
	},

	dirty( state = false, action ) {
		switch ( action.type ) {
			case 'RESET_BLOCKS':
			case 'REQUEST_POST_UPDATE_SUCCESS':
				return false;

			case 'UPDATE_BLOCK':
			case 'INSERT_BLOCK':
			case 'MOVE_BLOCK_DOWN':
			case 'MOVE_BLOCK_UP':
			case 'REPLACE_BLOCKS':
			case 'REMOVE_BLOCK':
			case 'EDIT_POST':
				return true;
		}

		return state;
	},

	blocksByUid( state = {}, action ) {
		switch ( action.type ) {
			case 'RESET_BLOCKS':
				return keyBy( action.blocks, 'uid' );

			case 'UPDATE_BLOCK':
				return {
					...state,
					[ action.uid ]: {
						...state[ action.uid ],
						...action.updates,
					},
				};

			case 'INSERT_BLOCK':
				return {
					...state,
					[ action.block.uid ]: action.block,
				};

			case 'REPLACE_BLOCKS':
				if ( ! action.blocks ) {
					return state;
				}
				return action.blocks.reduce( ( memo, block ) => {
					return {
						...memo,
						[ block.uid ]: block,
					};
				}, omit( state, action.uids ) );

			case 'REMOVE_BLOCK':
				return omit( state, action.uid );
		}

		return state;
	},

	blockOrder( state = [], action ) {
		let index;
		let swappedUid;
		switch ( action.type ) {
			case 'RESET_BLOCKS':
				return action.blocks.map( ( { uid } ) => uid );

			case 'INSERT_BLOCK':
				const position = action.after ? state.indexOf( action.after ) + 1 : state.length;
				return [
					...state.slice( 0, position ),
					action.block.uid,
					...state.slice( position ),
				];

			case 'MOVE_BLOCK_UP':
				if ( action.uid === state[ 0 ] ) {
					return state;
				}
				index = state.indexOf( action.uid );
				swappedUid = state[ index - 1 ];
				return [
					...state.slice( 0, index - 1 ),
					action.uid,
					swappedUid,
					...state.slice( index + 1 ),
				];

			case 'MOVE_BLOCK_DOWN':
				if ( action.uid === last( state ) ) {
					return state;
				}
				index = state.indexOf( action.uid );
				swappedUid = state[ index + 1 ];
				return [
					...state.slice( 0, index ),
					swappedUid,
					action.uid,
					...state.slice( index + 2 ),
				];

			case 'REPLACE_BLOCKS':
				if ( ! action.blocks ) {
					return state;
				}
				index = state.indexOf( action.uids[ 0 ] );
				return state.reduce( ( memo, uid ) => {
					if ( uid === action.uids[ 0 ] ) {
						return memo.concat( action.blocks.map( ( block ) => block.uid ) );
					}
					if ( action.uids.indexOf( uid ) === -1 ) {
						memo.push( uid );
					}
					return memo;
				}, [] );

			case 'REMOVE_BLOCK':
				return without( state, action.uid );
		}

		return state;
	},
}, { resetTypes: [ 'RESET_BLOCKS' ] } );

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
		case 'RESET_BLOCKS':
			return action.post || state;

		case 'REQUEST_POST_UPDATE_SUCCESS':
			return action.post;
	}

	return state;
}

/**
 * Reducer returning selected block state.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export function selectedBlock( state = {}, action ) {
	switch ( action.type ) {
		case 'TOGGLE_BLOCK_SELECTED':
			if ( ! action.selected ) {
				return state.uid === action.uid ? {} : state;
			}
			return action.uid === state.uid && ! state.typing
				? state
				: {
					uid: action.uid,
					typing: false,
					focus: action.uid === state.uid ? state.focus : {},
				};

		case 'CLEAR_SELECTED_BLOCK':
			return {};

		case 'MOVE_BLOCK_UP':
		case 'MOVE_BLOCK_DOWN':
			return action.uid === state.uid
				? state
				: { uid: action.uid, typing: false, focus: {} };

		case 'INSERT_BLOCK':
			return {
				uid: action.block.uid,
				typing: false,
				focus: {},
			};

		case 'UPDATE_FOCUS':
			return {
				uid: action.uid,
				typing: state.uid === action.uid ? state.typing : false,
				focus: action.config || {},
			};

		case 'START_TYPING':
			if ( action.uid !== state.uid ) {
				return {
					uid: action.uid,
					typing: true,
					focus: {},
				};
			}

			return {
				...state,
				typing: true,
			};

		case 'REPLACE_BLOCKS':
			if ( ! action.blocks || ! action.blocks.length || action.uids.indexOf( state.uid ) === -1 ) {
				return state;
			}

			return {
				uid: action.blocks[ 0 ].uid,
				typing: false,
				focus: {},
			};
	}

	return state;
}

/**
 * Reducer returning hovered block state.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export function hoveredBlock( state = null, action ) {
	switch ( action.type ) {
		case 'TOGGLE_BLOCK_HOVERED':
			return action.hovered ? action.uid : null;

		case 'TOGGLE_BLOCK_SELECTED':
			if ( action.selected ) {
				return null;
			}
			break;

		case 'START_TYPING':
			return null;

		case 'REPLACE_BLOCKS':
			if ( ! action.blocks || ! action.blocks.length || action.uids.indexOf( state ) === -1 ) {
				return state;
			}

			return action.blocks[ 0 ].uid;
	}

	return state;
}

/**
 * Reducer returning the block insertion point
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export function insertionPoint( state = { show: false }, action ) {
	switch ( action.type ) {
		case 'SET_INSERTION_POINT':
			return {
				show: true,
				uid: action.uid,
			};
		case 'CLEAR_INSERTION_POINT':
			return {
				show: false,
			};
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

export function isSidebarOpened( state = false, action ) {
	switch ( action.type ) {
		case 'TOGGLE_SIDEBAR':
			return ! state;
	}

	return state;
}

/**
 * Reducer returning current network request state (whether a request to the WP
 * REST API is in progress, successful, or failed).
 *
 * @param  {string} state  Current state
 * @param  {Object} action Dispatched action
 * @return {string}        Updated state
 */
export function saving( state = {}, action ) {
	switch ( action.type ) {
		case 'REQUEST_POST_UPDATE':
			return {
				requesting: true,
				successful: false,
				error: null,
				isNew: action.isNew,
			};

		case 'REQUEST_POST_UPDATE_SUCCESS':
			return {
				requesting: false,
				successful: true,
				error: null,
				isNew: false,
			};

		case 'REQUEST_POST_UPDATE_FAILURE':
			return {
				requesting: false,
				successful: false,
				error: action.error,
				isNew: action.isNew,
			};
	}

	return state;
}

/**
 * Creates a new instance of a Redux store.
 *
 * @return {Redux.Store} Redux store
 */
export function createReduxStore() {
	const reducer = combineReducers( {
		editor,
		currentPost,
		selectedBlock,
		hoveredBlock,
		insertionPoint,
		mode,
		isSidebarOpened,
		saving,
	} );

	const enhancers = [ applyMiddleware( refx( effects ) ) ];
	if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
		enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__() );
	}

	return createStore( reducer, flowRight( enhancers ) );
}

export default createReduxStore;
