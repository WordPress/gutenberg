/**
 * External dependencies
 */
import optimist from 'redux-optimist';
import { combineReducers } from 'redux';
import { difference, get, reduce, keyBy, keys, first, last, omit, pick, without, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockTypes, getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { combineUndoableReducers } from './utils/undoable-reducer';
import { STORE_DEFAULTS } from './store-defaults';

/***
 * Module constants
 */
const MAX_RECENT_BLOCKS = 8;

/**
 * Returns a post attribute value, flattening nested rendered content using its
 * raw value in place of its original object form.
 *
 * @param  {*} value Original value
 * @return {*}       Raw value
 */
export function getPostRawValue( value ) {
	if ( 'object' === typeof value && 'raw' in value ) {
		return value.raw;
	}

	return value;
}

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

			case 'RESET_BLOCKS':
				if ( 'content' in state ) {
					return omit( state, 'content' );
				}

				return state;

			case 'RESET_POST':
				return reduce( state, ( result, value, key ) => {
					if ( value !== getPostRawValue( action.post[ key ] ) ) {
						return result;
					}

					if ( state === result ) {
						result = { ...state };
					}

					delete result[ key ];
					return result;
				}, state );
		}

		return state;
	},

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

			case 'UPDATE_BLOCK':
				// Ignore updates if block isn't known
				if ( ! state[ action.uid ] ) {
					return state;
				}

				return {
					...state,
					[ action.uid ]: {
						...state[ action.uid ],
						...action.updates,
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
				const position = action.position !== undefined ? action.position : state.length;
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
}, { resetTypes: [ 'RESET_POST' ] } );

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
		case 'UPDATE_POST':
			let post;
			if ( action.post ) {
				post = action.post;
			} else if ( action.edits ) {
				post = {
					...state,
					...action.edits,
				};
			} else {
				return state;
			}

			return mapValues( post, getPostRawValue );
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
 * Reducer returning the block selection's state.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export function blockSelection( state = { start: null, end: null, focus: null }, action ) {
	switch ( action.type ) {
		case 'CLEAR_SELECTED_BLOCK':
			return {
				start: null,
				end: null,
				focus: null,
			};
		case 'START_MULTI_SELECT':
			return {
				...state,
				isMultiSelecting: true,
			};
		case 'STOP_MULTI_SELECT':
			return omit( state, 'isMultiSelecting' );
		case 'MULTI_SELECT':
			return {
				start: action.start,
				end: action.end,
				focus: state.focus,
			};
		case 'SELECT_BLOCK':
			if ( action.uid === state.start && action.uid === state.end ) {
				return state;
			}
			return {
				start: action.uid,
				end: action.uid,
				focus: action.focus || {},
			};
		case 'UPDATE_FOCUS':
			return {
				start: action.uid,
				end: action.uid,
				focus: action.config || {},
			};
		case 'INSERT_BLOCKS':
			return {
				start: action.blocks[ 0 ].uid,
				end: action.blocks[ 0 ].uid,
				focus: {},
			};
		case 'REPLACE_BLOCKS':
			if ( ! action.blocks || ! action.blocks.length || action.uids.indexOf( state.start ) === -1 ) {
				return state;
			}
			return {
				start: action.blocks[ 0 ].uid,
				end: action.blocks[ 0 ].uid,
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
		case 'SELECT_BLOCK':
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

export function blocksMode( state = {}, action ) {
	if ( action.type === 'TOGGLE_BLOCK_MODE' ) {
		const { uid } = action;
		return {
			...state,
			[ uid ]: state[ uid ] && state[ uid ] === 'html' ? 'visual' : 'html',
		};
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
export function blockInsertionPoint( state = {}, action ) {
	switch ( action.type ) {
		case 'SET_BLOCK_INSERTION_POINT':
			const { position } = action;
			return { ...state, position };

		case 'CLEAR_BLOCK_INSERTION_POINT':
			return { ...state, position: null };

		case 'SHOW_INSERTION_POINT':
			return { ...state, visible: true };

		case 'HIDE_INSERTION_POINT':
			return { ...state, visible: false };
	}

	return state;
}

/**
 * Reducer returning the user preferences:
 *
 * @param  {Object}  state                 Current state
 * @param  {string}  state.mode            Current editor mode, either "visual" or "text".
 * @param  {Boolean} state.isSidebarOpened Whether the sidebar is opened or closed
 * @param  {Object}  state.panels          The state of the different sidebar panels
 * @param  {Object}  action                Dispatched action
 * @return {string}                        Updated state
 */
export function preferences( state = STORE_DEFAULTS.preferences, action ) {
	switch ( action.type ) {
		case 'TOGGLE_SIDEBAR':
			return {
				...state,
				isSidebarOpened: ! state.isSidebarOpened,
			};
		case 'TOGGLE_SIDEBAR_PANEL':
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
				mode: action.mode,
			};
		case 'INSERT_BLOCKS':
			// record the block usage and put the block in the recently used blocks
			let blockUsage = state.blockUsage;
			let recentlyUsedBlocks = [ ...state.recentlyUsedBlocks ];
			action.blocks.forEach( ( block ) => {
				const uses = ( blockUsage[ block.name ] || 0 ) + 1;
				blockUsage = omit( blockUsage, block.name );
				blockUsage[ block.name ] = uses;
				recentlyUsedBlocks = [ block.name, ...without( recentlyUsedBlocks, block.name ) ].slice( 0, MAX_RECENT_BLOCKS );
			} );
			return {
				...state,
				blockUsage,
				recentlyUsedBlocks,
			};
		case 'SETUP_EDITOR':
			const isBlockDefined = name => getBlockType( name ) !== undefined;
			const filterInvalidBlocksFromList = list => list.filter( isBlockDefined );
			const filterInvalidBlocksFromObject = obj => pick( obj, keys( obj ).filter( isBlockDefined ) );
			const commonBlocks = getBlockTypes()
				.filter( ( blockType ) => 'common' === blockType.category )
				.map( ( blockType ) => blockType.name );

			return {
				...state,
				// recently used gets filled up to `MAX_RECENT_BLOCKS` with blocks from the common category
				recentlyUsedBlocks: filterInvalidBlocksFromList( [ ...state.recentlyUsedBlocks ] )
					.concat( difference( commonBlocks, state.recentlyUsedBlocks ) )
					.slice( 0, MAX_RECENT_BLOCKS ),
				blockUsage: filterInvalidBlocksFromObject( state.blockUsage ),
			};
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

export default optimist( combineReducers( {
	editor,
	currentPost,
	isTyping,
	blockSelection,
	hoveredBlock,
	blocksMode,
	blockInsertionPoint,
	preferences,
	panel,
	saving,
	notices,
} ) );
