/**
 * External dependencies
 */
import optimist from 'redux-optimist';
import {
	flow,
	reduce,
	first,
	last,
	omit,
	without,
	mapValues,
	findIndex,
	reject,
	omitBy,
	keys,
	isEqual,
	includes,
	overSome,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { isReusableBlock } from '@wordpress/blocks';
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import withHistory from '../utils/with-history';
import withChangeDetection from '../utils/with-change-detection';
import { PREFERENCES_DEFAULTS } from './defaults';

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
 * Given an array of blocks, returns an object where each key is a nesting
 * context, the value of which is an array of block UIDs existing within that
 * nesting context.
 *
 * @param {Array}   blocks  Blocks to map.
 * @param {?string} rootUID Assumed root UID.
 *
 * @return {Object} Block order map object.
 */
function mapBlockOrder( blocks, rootUID = '' ) {
	const result = { [ rootUID ]: [] };

	blocks.forEach( ( block ) => {
		const { uid, innerBlocks } = block;

		result[ rootUID ].push( uid );

		Object.assign( result, mapBlockOrder( innerBlocks, uid ) );
	} );

	return result;
}

/**
 * Given an array of blocks, returns an object containing all blocks, recursing
 * into inner blocks. Keys correspond to the block UID, the value of which is
 * the block object.
 *
 * @param {Array} blocks Blocks to flatten.
 *
 * @return {Object} Flattened blocks object.
 */
function getFlattenedBlocks( blocks ) {
	const flattenedBlocks = {};

	const stack = [ ...blocks ];
	while ( stack.length ) {
		// `innerBlocks` is redundant data which can fall out of sync, since
		// this is reflected in `blockOrder`, so exclude from appended block.
		const { innerBlocks, ...block } = stack.shift();

		stack.push( ...innerBlocks );

		flattenedBlocks[ block.uid ] = block;
	}

	return flattenedBlocks;
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
 * dispatched action, the two actions are updating the same block attribute, or
 * false otherwise.
 *
 * @param {Object} action         Currently dispatching action.
 * @param {Object} previousAction Previously dispatched action.
 *
 * @return {boolean} Whether actions are updating the same block attribute.
 */
export function isUpdatingSameBlockAttribute( action, previousAction ) {
	return (
		action.type === 'UPDATE_BLOCK_ATTRIBUTES' &&
		action.uid === previousAction.uid &&
		hasSameKeys( action.attributes, previousAction.attributes )
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
	if ( ! previousAction || action.type !== previousAction.type ) {
		return false;
	}

	return overSome( [
		isUpdatingSameBlockAttribute,
		isUpdatingSamePostProperty,
	] )( action, previousAction );
}

/**
 * Higher-order reducer targeting the combined editor reducer, augmenting
 * block UIDs in remove action to include cascade of inner blocks.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withInnerBlocksRemoveCascade = ( reducer ) => ( state, action ) => {
	if ( state && action.type === 'REMOVE_BLOCKS' ) {
		const uids = [ ...action.uids ];

		// For each removed UID, include its inner blocks in UIDs to remove,
		// recursing into those so long as inner blocks exist.
		for ( let i = 0; i < uids.length; i++ ) {
			uids.push( ...state.blockOrder[ uids[ i ] ] );
		}

		action = { ...action, uids };
	}

	return reducer( state, action );
};

/**
 * Undoable reducer returning the editor post state, including blocks parsed
 * from current HTML markup.
 *
 * Handles the following state keys:
 *  - edits: an object describing changes to be made to the current post, in
 *           the format accepted by the WP REST API
 *  - blocksByUid: post content blocks keyed by UID
 *  - blockOrder: object where each key is a UID, its value an array of uids
 *                representing the order of its inner blocks
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @returns {Object} Updated state.
 */
export const editor = flow( [
	combineReducers,

	withInnerBlocksRemoveCascade,

	// Track undo history, starting at editor initialization.
	withHistory( {
		resetTypes: [ 'SETUP_EDITOR_STATE' ],
		ignoreTypes: [ 'RECEIVE_BLOCKS' ],
		shouldOverwriteState,
	} ),

	// Track whether changes exist, resetting at each post save. Relies on
	// editor initialization firing post reset as an effect.
	withChangeDetection( {
		resetTypes: [ 'SETUP_EDITOR_STATE', 'RESET_POST' ],
		ignoreTypes: [ 'RECEIVE_BLOCKS' ],
	} ),
] )( {
	edits( state = {}, action ) {
		switch ( action.type ) {
			case 'EDIT_POST':
			case 'SETUP_EDITOR_STATE':
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
			case 'SETUP_EDITOR_STATE':
				return getFlattenedBlocks( action.blocks );

			case 'RECEIVE_BLOCKS':
				return {
					...state,
					...getFlattenedBlocks( action.blocks ),
				};

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
					...getFlattenedBlocks( action.blocks ),
				};

			case 'REPLACE_BLOCKS':
				if ( ! action.blocks ) {
					return state;
				}

				return {
					...omit( state, action.uids ),
					...getFlattenedBlocks( action.blocks ),
				};

			case 'REMOVE_BLOCKS':
				return omit( state, action.uids );

			case 'SAVE_REUSABLE_BLOCK_SUCCESS': {
				const { id, updatedId } = action;

				// If a temporary reusable block is saved, we swap the temporary id with the final one
				if ( id === updatedId ) {
					return state;
				}

				return mapValues( state, ( block ) => {
					if ( block.name === 'core/block' && block.attributes.ref === id ) {
						return {
							...block,
							attributes: {
								...block.attributes,
								ref: updatedId,
							},
						};
					}

					return block;
				} );
			}
		}

		return state;
	},

	blockOrder( state = {}, action ) {
		switch ( action.type ) {
			case 'RESET_BLOCKS':
			case 'SETUP_EDITOR_STATE':
				return mapBlockOrder( action.blocks );

			case 'RECEIVE_BLOCKS':
				return {
					...state,
					...omit( mapBlockOrder( action.blocks ), '' ),
				};

			case 'INSERT_BLOCKS': {
				const { rootUID = '', blocks } = action;

				const subState = state[ rootUID ] || [];
				const mappedBlocks = mapBlockOrder( blocks, rootUID );

				const { index = subState.length } = action;

				return {
					...state,
					...mappedBlocks,
					[ rootUID ]: [
						...subState.slice( 0, index ),
						...mappedBlocks[ rootUID ],
						...subState.slice( index ),
					],
				};
			}

			case 'MOVE_BLOCKS_UP': {
				const { uids, rootUID = '' } = action;
				const firstUid = first( uids );
				const lastUid = last( uids );
				const subState = state[ rootUID ];

				if ( ! subState.length || firstUid === first( subState ) ) {
					return state;
				}

				const firstIndex = subState.indexOf( firstUid );
				const lastIndex = subState.indexOf( lastUid );
				const swappedUid = subState[ firstIndex - 1 ];

				return {
					...state,
					[ rootUID ]: [
						...subState.slice( 0, firstIndex - 1 ),
						...uids,
						swappedUid,
						...subState.slice( lastIndex + 1 ),
					],
				};
			}

			case 'MOVE_BLOCKS_DOWN': {
				const { uids, rootUID = '' } = action;
				const firstUid = first( uids );
				const lastUid = last( uids );
				const subState = state[ rootUID ];

				if ( ! subState.length || lastUid === last( subState ) ) {
					return state;
				}

				const firstIndex = subState.indexOf( firstUid );
				const lastIndex = subState.indexOf( lastUid );
				const swappedUid = subState[ lastIndex + 1 ];

				return {
					...state,
					[ rootUID ]: [
						...subState.slice( 0, firstIndex ),
						swappedUid,
						...uids,
						...subState.slice( lastIndex + 2 ),
					],
				};
			}

			case 'REPLACE_BLOCKS': {
				const { blocks, uids } = action;
				if ( ! blocks ) {
					return state;
				}

				const mappedBlocks = mapBlockOrder( blocks );

				return flow( [
					( nextState ) => omit( nextState, uids ),
					( nextState ) => ( {
						...nextState,
						...omit( mappedBlocks, '' ),
					} ),
					( nextState ) => mapValues( nextState, ( subState ) => (
						reduce( subState, ( result, uid ) => {
							if ( uid === uids[ 0 ] ) {
								return [
									...result,
									...mappedBlocks[ '' ],
								];
							}

							if ( uids.indexOf( uid ) === -1 ) {
								result.push( uid );
							}

							return result;
						}, [] )
					) ),
				] )( state );
			}

			case 'REMOVE_BLOCKS':
				return flow( [
					// Remove inner block ordering for removed blocks
					( nextState ) => omit( nextState, action.uids ),

					// Remove deleted blocks from other blocks' orderings
					( nextState ) => mapValues( nextState, ( subState ) => (
						without( subState, ...action.uids )
					) ),
				] )( state );
		}

		return state;
	},
} );

/**
 * Reducer returning the last-known state of the current post, in the format
 * returned by the WP REST API.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function currentPost( state = {}, action ) {
	switch ( action.type ) {
		case 'SETUP_EDITOR_STATE':
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
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {boolean} Updated state.
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
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function blockSelection( state = {
	start: null,
	end: null,
	isMultiSelecting: false,
	isEnabled: true,
	initialPosition: null,
}, action ) {
	switch ( action.type ) {
		case 'CLEAR_SELECTED_BLOCK':
			if ( state.start === null && state.end === null && ! state.isMultiSelecting ) {
				return state;
			}

			return {
				...state,
				start: null,
				end: null,
				isMultiSelecting: false,
				initialPosition: null,
			};
		case 'START_MULTI_SELECT':
			if ( state.isMultiSelecting ) {
				return state;
			}

			return {
				...state,
				isMultiSelecting: true,
				initialPosition: null,
			};
		case 'STOP_MULTI_SELECT':
			if ( ! state.isMultiSelecting ) {
				return state;
			}

			return {
				...state,
				isMultiSelecting: false,
				initialPosition: null,
			};
		case 'MULTI_SELECT':
			return {
				...state,
				start: action.start,
				end: action.end,
				initialPosition: null,
			};
		case 'SELECT_BLOCK':
			if ( action.uid === state.start && action.uid === state.end ) {
				return state;
			}
			return {
				...state,
				start: action.uid,
				end: action.uid,
				initialPosition: action.initialPosition,
			};
		case 'INSERT_BLOCKS':
			return {
				...state,
				start: action.blocks[ 0 ].uid,
				end: action.blocks[ 0 ].uid,
				initialPosition: null,
				isMultiSelecting: false,
			};
		case 'REPLACE_BLOCKS':
			if ( ! action.blocks || ! action.blocks.length || action.uids.indexOf( state.start ) === -1 ) {
				return state;
			}
			return {
				...state,
				start: action.blocks[ 0 ].uid,
				end: action.blocks[ 0 ].uid,
				initialPosition: null,
				isMultiSelecting: false,
			};
		case 'TOGGLE_SELECTION':
			return {
				...state,
				isEnabled: action.isSelectionEnabled,
			};
	}

	return state;
}

/**
 * Reducer returning the UID of the provisional block. A provisional block is
 * one which is to be removed if it does not receive updates in the time until
 * the next selection or block reset.
 *
 * @param {string} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function provisionalBlockUID( state = null, action ) {
	switch ( action.type ) {
		case 'INSERT_BLOCKS':
			if ( action.isProvisional ) {
				return first( action.blocks ).uid;
			}
			break;

		case 'RESET_BLOCKS':
			return null;

		case 'UPDATE_BLOCK_ATTRIBUTES':
		case 'UPDATE_BLOCK':
		case 'CONVERT_BLOCK_TO_REUSABLE':
			const { uid } = action;
			if ( uid === state ) {
				return null;
			}
			break;

		case 'REPLACE_BLOCKS':
		case 'REMOVE_BLOCKS':
			const { uids } = action;
			if ( includes( uids, state ) ) {
				return null;
			}
			break;
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

export function keyboardMode( state = 'navigation', action ) {
	if ( action.type === 'SET_KEYBOARD_MODE' ) {
		return action.mode;
	}

	return state;
}

/**
 * Reducer returning the block insertion point visibility, a boolean value
 * reflecting whether the insertion point should be shown.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function isInsertionPointVisible( state = false, action ) {
	switch ( action.type ) {
		case 'SHOW_INSERTION_POINT':
			return true;

		case 'HIDE_INSERTION_POINT':
			return false;
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
		case 'SETUP_EDITOR':
			return {
				...state,
				template: action.settings.template,
				lock: action.settings.templateLock,
			};
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
 * @param {Object}  state                 Current state.
 * @param {string}  state.mode            Current editor mode, either "visual" or "text".
 * @param {boolean} state.isSidebarOpened Whether the sidebar is opened or closed.
 * @param {Object}  state.panels          The state of the different sidebar panels.
 * @param {Object}  action                Dispatched action.
 *
 * @return {string} Updated state.
 */
export function preferences( state = PREFERENCES_DEFAULTS, action ) {
	switch ( action.type ) {
		case 'INSERT_BLOCKS':
		case 'REPLACE_BLOCKS':
			return action.blocks.reduce( ( prevState, block ) => {
				let id = block.name;
				const insert = { name: block.name };
				if ( isReusableBlock( block ) ) {
					insert.ref = block.attributes.ref;
					id += '/' + block.attributes.ref;
				}

				return {
					...prevState,
					insertUsage: {
						...prevState.insertUsage,
						[ id ]: {
							time: action.time,
							count: prevState.insertUsage[ id ] ? prevState.insertUsage[ id ].count + 1 : 1,
							insert,
						},
					},
				};
			}, state );

		case 'REMOVE_REUSABLE_BLOCK':
			return {
				...state,
				insertUsage: omitBy( state.insertUsage, ( { insert } ) => insert.ref === action.id ),
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

export function notices( state = [], action ) {
	switch ( action.type ) {
		case 'CREATE_NOTICE':
			return [
				...reject( state, { id: action.notice.id } ),
				action.notice,
			];

		case 'REMOVE_NOTICE':
			const { noticeId } = action;
			const index = findIndex( state, { id: noticeId } );
			if ( index === -1 ) {
				return state;
			}

			return [
				...state.slice( 0, index ),
				...state.slice( index + 1 ),
			];
	}

	return state;
}

export const reusableBlocks = combineReducers( {
	data( state = {}, action ) {
		switch ( action.type ) {
			case 'RECEIVE_REUSABLE_BLOCKS': {
				return reduce( action.results, ( nextState, result ) => {
					const { id, title } = result.reusableBlock;
					const { uid } = result.parsedBlock;

					const value = { uid, title };

					if ( ! isEqual( nextState[ id ], value ) ) {
						if ( nextState === state ) {
							nextState = { ...nextState };
						}

						nextState[ id ] = value;
					}

					return nextState;
				}, state );
			}

			case 'UPDATE_REUSABLE_BLOCK_TITLE': {
				const { id, title } = action;

				if ( ! state[ id ] || state[ id ].title === title ) {
					return state;
				}

				return {
					...state,
					[ id ]: {
						...state[ id ],
						title,
					},
				};
			}

			case 'SAVE_REUSABLE_BLOCK_SUCCESS': {
				const { id, updatedId } = action;

				// If a temporary reusable block is saved, we swap the temporary id with the final one
				if ( id === updatedId ) {
					return state;
				}

				const value = state[ id ];
				return {
					...omit( state, id ),
					[ updatedId ]: value,
				};
			}

			case 'REMOVE_REUSABLE_BLOCK': {
				const { id } = action;
				return omit( state, id );
			}
		}

		return state;
	},

	isFetching( state = {}, action ) {
		switch ( action.type ) {
			case 'FETCH_REUSABLE_BLOCKS': {
				const { id } = action;
				if ( ! id ) {
					return state;
				}

				return {
					...state,
					[ id ]: true,
				};
			}

			case 'FETCH_REUSABLE_BLOCKS_SUCCESS':
			case 'FETCH_REUSABLE_BLOCKS_FAILURE': {
				const { id } = action;
				return omit( state, id );
			}
		}

		return state;
	},

	isSaving( state = {}, action ) {
		switch ( action.type ) {
			case 'SAVE_REUSABLE_BLOCK':
				return {
					...state,
					[ action.id ]: true,
				};

			case 'SAVE_REUSABLE_BLOCK_SUCCESS':
			case 'SAVE_REUSABLE_BLOCK_FAILURE': {
				const { id } = action;
				return omit( state, id );
			}
		}

		return state;
	},
} );

export default optimist( combineReducers( {
	editor,
	currentPost,
	isTyping,
	blockSelection,
	provisionalBlockUID,
	blocksMode,
	isInsertionPointVisible,
	preferences,
	saving,
	notices,
	reusableBlocks,
	template,
	keyboardMode,
} ) );
