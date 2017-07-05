/**
 * External dependencies
 */
import optimist from 'redux-optimist';
import { combineReducers, applyMiddleware, createStore } from 'redux';
import refx from 'refx';
import { reduce, keyBy, first, last, omit, without, flowRight, forOwn } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockTypes } from 'blocks';

/**
 * Internal dependencies
 */
import { combineUndoableReducers } from './utils/undoable-reducer';
import effects from './effects';

/**
 * Collaboration Dependencies
 */
import GRTC from '../grtc/app';

const isMobile = window.innerWidth < 782;
const renderedPostProps = new Set( [ 'guid', 'title', 'excerpt', 'content' ] );

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
			case 'RESET_BLOCKS':
			case 'REQUEST_POST_UPDATE_SUCCESS':
			case 'TRASH_POST_SUCCESS':
				return false;

			case 'UPDATE_BLOCK_ATTRIBUTES':
			case 'INSERT_BLOCKS':
			case 'MOVE_BLOCKS_DOWN':
			case 'MOVE_BLOCKS_UP':
			case 'REPLACE_BLOCKS':
			case 'REMOVE_BLOCKS':
			case 'EDIT_POST':
			case 'MARK_DIRTY':
				return true;
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
						if ( result === state[ action.uid ] ) {
							result = { ...state[ action.uid ] };
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
			case 'LOAD_USER_DATA':
				// This is where we initially populate the recently used blocks,
				// for now this inserts blocks from the common category, but will
				// load this from an API in the future.
				return getBlockTypes()
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

export function collaborationMode( state = {}, action ) {
	switch ( action.type ) {
		case 'COLLABORATION_MODE':
			return {
				...state,
				active: action.active,
			};

		case 'COLLABORATION_STATE':
			return {
				...state,
				blocksByUid: action.blocksByUid,
				peerName: action.peerName,
				peerColor: action.peerColor,
				peerID: action.peerID,
			};
	}
	return state;
}

const grtcMiddleware = function( { dispatch } ) {
	let grtc = {};
	let grtcID = window.location.hash.slice( 1, window.location.hash.length );
	let manualGRTC = true;

	const grtcAPI = window.location.origin + '/wp-json/collaborate';
	const peerID = GRTC.uuid();

	const grtcProps = window.grtcProps = {
		peerColor: GRTC.randomColor(),
		peerID,
		lastPeerData: null,
		peerName: null,
	};

	/**
	 * @return {Promise} promise object for username fetch.
	 * Resolves promise if username fetch failed.
	 */
	function getUsername() {
		return new Promise( ( resolve, reject ) => {
			jQuery.get( grtcAPI + '/username', resolve ).fail( reject );
		} );
	}

	/**
	 * @param {Boolean} active is collaboration mode
	 * @param {Object} reduxStore for reference in current scope.
	 * Initializes itself if collaboration mode is enabled.
	 * else Destory the P2P Data channels.
	 */
	function checkMode( active ) {
		if ( active ) {
			if ( window.location.hash.length === 0 ) {
				grtcID = GRTC.uuid();
				window.history.pushState( '', '', '#' + grtcID );
				startMode( grtcID, grtcAPI );
			} else {
				startMode( grtcID, grtcAPI );
			}
		} else if ( ! grtc.isConnected ) {
			grtc.peer.destroy();
		}
	}

	/**
	 * Start the grtc module and enable its API.
	 * @param {string} id the unique doc id
	 * @param {string} url url to which module will interact.
	 */
	function startMode( id, url ) {
		getUsername().then( ( username ) => {
			grtcProps.peerName = username;
			grtc = new GRTC( id, url, username );
			grtc.on( 'peerData', onReceivedAction );
			// Temporary change for testing, Not using alert. Need UI.
			grtc.on( 'peerConnected', function() {
				alert( 'Peer connected' );
			} );
		} );
	}

	/**
	 * @param {Object} action is redux action
	 * send if grtc is connected & peerID is undefined
	 * to stop infinite loop.
	 */
	function onAction( action ) {
		if ( action.type === 'TOGGLE_BLOCK_SELECTED' || action.type === 'UPDATE_FOCUS' ) {
			return;
		}

		if ( grtc.isConnected && typeof action.peerID === 'undefined' ) {
			action.peerID = peerID;
			grtc.send( action );
		} else if ( grtc.isConnected && action.type === 'COLLABORATION_STATE' ) {
			grtc.send( action );
		}
	}

	/**
	 * @param {Object} action received from other peer.
	 * Dispatch the action using dispatch.
	 */
	function onReceivedAction( action ) {
		if ( typeof action.peerID !== 'undefined' && action.peerID !== peerID ) {
			dispatch( action );
		}
	}

	return next => action => {
		if ( action.type === 'COLLABORATION_MODE' ) {
			checkMode( action.active );
			manualGRTC = false;
		} else if ( window.location.hash.length !== 0 && manualGRTC ) {
			// if url is shared enable the collaboration mode automatically.
			manualGRTC = false;
			dispatch( {
				type: 'COLLABORATION_MODE',
				active: true,
				mode: 'manual',
			} );
		} else {
			onAction( action );
		}
		return next( action );
	};
};

/**
 * Creates a new instance of a Redux store.
 *
 * @return {Redux.Store} Redux store
 */
export function createReduxStore() {
	const reducer = optimist( combineReducers( {
		editor,
		currentPost,
		selectedBlock,
		isTyping,
		multiSelectedBlocks,
		hoveredBlock,
		showInsertionPoint,
		mode,
		isSidebarOpened,
		panel,
		saving,
		notices,
		userData,
		collaborationMode,
	} ) );

	const enhancers = [ applyMiddleware( refx( effects ), grtcMiddleware ) ];
	if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
		enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__() );
	}

	return createStore( reducer, flowRight( enhancers ) );
}

export default createReduxStore;
