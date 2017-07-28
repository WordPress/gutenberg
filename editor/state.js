/**
 * External dependencies
 */
import optimist from 'redux-optimist';
import { combineReducers, createStore } from 'redux';
import { reduce, keyBy, first, last, omit, without } from 'lodash';

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
export const editor = combineReducers( {
	blocksByUid( state = {}, action ) {
		switch ( action.type ) {
			case 'RESET_BLOCKS':
				return keyBy( action.blocks, 'uid' );

			case 'UPDATE_BLOCK_ATTRIBUTES':
				// Ignore updates if block isn't known
				if ( ! state[ action.uid ] ) {
					return state;
				}

				// Consider as updates only changed values
				const nextAttributes = reduce( action.attributes, ( result, value, key ) => {
					if ( value !== result[ key ] ) {
						// Avoid mutating original block by creating shallow clone
						if ( result === state[ action.uid ].attributes ) {
							result = { ...result };
						}

						result[ key ] = value;
					}

					return result;
				}, state[ action.uid ].attributes );

				// Skip update if nothing has been changed. The reference will
				// match the original block if `reduce` had no changed values.
				if ( nextAttributes === state[ action.uid ].attributes ) {
					return state;
				}

				// Otherwise merge attributes into state
				return {
					...state,
					[ action.uid ]: {
						...state[ action.uid ],
						attributes: nextAttributes,
					},
				};

			case 'INSERT_BLOCKS':
				return {
					...state,
					...keyBy( action.blocks, 'uid' ),
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

			case 'REMOVE_BLOCKS':
				return omit( state, action.uids );
		}

		return state;
	},

	blockOrder( state = [], action ) {
		switch ( action.type ) {
			case 'RESET_BLOCKS':
				return action.blocks.map( ( { uid } ) => uid );

			case 'INSERT_BLOCKS': {
				const position = action.after ? state.indexOf( action.after ) + 1 : state.length;
				return [
					...state.slice( 0, position ),
					...action.blocks.map( block => block.uid ),
					...state.slice( position ),
				];
			}

			case 'MOVE_BLOCKS_UP': {
				const firstUid = first( action.uids );
				const lastUid = last( action.uids );

				if ( ! state.length || firstUid === first( state ) ) {
					return state;
				}

				const firstIndex = state.indexOf( firstUid );
				const lastIndex = state.indexOf( lastUid );
				const swappedUid = state[ firstIndex - 1 ];

				return [
					...state.slice( 0, firstIndex - 1 ),
					...action.uids,
					swappedUid,
					...state.slice( lastIndex + 1 ),
				];
			}

			case 'MOVE_BLOCKS_DOWN': {
				const firstUid = first( action.uids );
				const lastUid = last( action.uids );

				if ( ! state.length || lastUid === last( state ) ) {
					return state;
				}

				const firstIndex = state.indexOf( firstUid );
				const lastIndex = state.indexOf( lastUid );
				const swappedUid = state[ lastIndex + 1 ];

				return [
					...state.slice( 0, firstIndex ),
					swappedUid,
					...action.uids,
					...state.slice( lastIndex + 2 ),
				];
			}

			case 'REPLACE_BLOCKS':
				if ( ! action.blocks ) {
					return state;
				}

				return state.reduce( ( memo, uid ) => {
					if ( uid === action.uids[ 0 ] ) {
						return memo.concat( action.blocks.map( ( block ) => block.uid ) );
					}
					if ( action.uids.indexOf( uid ) === -1 ) {
						memo.push( uid );
					}
					return memo;
				}, [] );

			case 'REMOVE_BLOCKS':
				return without( state, ...action.uids );
		}

		return state;
	},
}, { resetTypes: [ 'RESET_BLOCKS' ] } );

/**
 * Reducer loading and saving user specific data, such as preferences and
 * block usage.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export const userData = combineReducers( {
	recentlyUsedBlocks( state = [], action ) {
		const maxRecent = 8;
		switch ( action.type ) {
			case 'INIT_EDITOR':
				// This is where we initially populate the recently used blocks,
				// for now this inserts blocks from the common category, but will
				// load this from an API in the future.
				return action.config.blockTypes
					.filter( ( blockType ) => 'common' === blockType.category )
					.slice( 0, maxRecent )
					.map( ( blockType ) => blockType.name );
			case 'INSERT_BLOCKS':
				// This is where we record the block usage so it can show up in
				// the recent blocks.
				let newState = [ ...state ];
				action.blocks.forEach( ( block ) => {
					newState = [ block.name, ...without( newState, block.name ) ];
				} );
				return newState.slice( 0, maxRecent );
		}
		return state;
	},
} );

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
					focus: action.uid === state.uid ? state.focus : {},
				};

		case 'CLEAR_SELECTED_BLOCK':
			return {};

		case 'MOVE_BLOCKS_UP':
		case 'MOVE_BLOCKS_DOWN': {
			const firstUid = first( action.uids );
			return firstUid === state.uid
				? state
				: { uid: firstUid, focus: {} };
		}

		case 'INSERT_BLOCKS':
			return {
				uid: action.blocks[ 0 ].uid,
				focus: {},
			};

		case 'UPDATE_FOCUS':
			return {
				uid: action.uid,
				focus: action.config || {},
			};

		case 'REPLACE_BLOCKS':
			if ( ! action.blocks || ! action.blocks.length || action.uids.indexOf( state.uid ) === -1 ) {
				return state;
			}

			return {
				uid: action.blocks[ 0 ].uid,
				focus: {},
			};
	}

	return state;
}

/**
 * Reducer returning typing state.
 *
 * @param  {Boolean} state  Current state
 * @param  {Object}  action Dispatched action
 * @return {Boolean}        Updated state
 */
export function isTyping( state = false, action ) {
	switch ( action.type ) {
		case 'START_TYPING':
			return true;

		case 'STOP_TYPING':
			return false;
	}

	return state;
}

/**
 * Reducer returning multi selected block state.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export function multiSelectedBlocks( state = { start: null, end: null }, action ) {
	switch ( action.type ) {
		case 'CLEAR_SELECTED_BLOCK':
		case 'TOGGLE_BLOCK_SELECTED':
		case 'INSERT_BLOCKS':
			return {
				start: null,
				end: null,
			};
		case 'MULTI_SELECT':
			return {
				start: action.start,
				end: action.end,
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
		case 'MULTI_SELECT':
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
export function showInsertionPoint( state = false, action ) {
	switch ( action.type ) {
		case 'SHOW_INSERTION_POINT':
			return true;
		case 'HIDE_INSERTION_POINT':
			return false;
	}

	return state;
}

export function editorConfig( state = { blockTypes: [], categories: [], defaultBlockType: null, fallbackBlockType: null }, action ) {
	switch ( action.type ) {
		case 'INIT_EDITOR':
			return action.config;
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
		selectedBlock,
		isTyping,
		multiSelectedBlocks,
		hoveredBlock,
		showInsertionPoint,
		userData,
		editorConfig,
	} ) );

	return createStore( reducer );
}

export default createReduxStore;
