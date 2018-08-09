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
	overSome,
	get,
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
import { PREFERENCES_DEFAULTS, EDITOR_SETTINGS_DEFAULTS } from './defaults';
import { insertAt, moveTo } from './array';

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
 * context, the value of which is an array of block client IDs existing within
 * that nesting context.
 *
 * @param {Array}   blocks       Blocks to map.
 * @param {?string} rootClientId Assumed root client ID.
 *
 * @return {Object} Block order map object.
 */
function mapBlockOrder( blocks, rootClientId = '' ) {
	const result = { [ rootClientId ]: [] };

	blocks.forEach( ( block ) => {
		const { clientId, innerBlocks } = block;

		result[ rootClientId ].push( clientId );

		Object.assign( result, mapBlockOrder( innerBlocks, clientId ) );
	} );

	return result;
}

/**
 * Given an array of blocks, returns an object containing all blocks, recursing
 * into inner blocks. Keys correspond to the block client ID, the value of
 * which is the block object.
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

		flattenedBlocks[ block.clientId ] = block;
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
		action.clientId === previousAction.clientId &&
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
 * block client IDs in remove action to include cascade of inner blocks.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withInnerBlocksRemoveCascade = ( reducer ) => ( state, action ) => {
	if ( state && action.type === 'REMOVE_BLOCKS' ) {
		const clientIds = [ ...action.clientIds ];

		// For each removed client ID, include its inner blocks to remove,
		// recursing into those so long as inner blocks exist.
		for ( let i = 0; i < clientIds.length; i++ ) {
			clientIds.push( ...state.blockOrder[ clientIds[ i ] ] );
		}

		action = { ...action, clientIds };
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
 *  - blocksByClientId: post content blocks keyed by client ID
 *  - blockOrder: object where each key is a client ID, its value an array of
 *                client IDs representing the order of its inner blocks
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
		ignoreTypes: [ 'RECEIVE_BLOCKS', 'RESET_POST', 'UPDATE_POST' ],
		shouldOverwriteState,
	} ),

	// Track whether changes exist, resetting at each post save. Relies on
	// editor initialization firing post reset as an effect.
	withChangeDetection( {
		resetTypes: [ 'SETUP_EDITOR_STATE', 'REQUEST_POST_UPDATE_START' ],
		ignoreTypes: [ 'RECEIVE_BLOCKS', 'RESET_POST', 'UPDATE_POST' ],
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

			case 'DIRTY_ARTIFICIALLY':
				return { ...state };

			case 'UPDATE_POST':
			case 'RESET_POST':
				const getCanonicalValue = action.type === 'UPDATE_POST' ?
					( key ) => action.edits[ key ] :
					( key ) => getPostRawValue( action.post[ key ] );

				return reduce( state, ( result, value, key ) => {
					if ( value !== getCanonicalValue( key ) ) {
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

	blocksByClientId( state = {}, action ) {
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
				if ( ! state[ action.clientId ] ) {
					return state;
				}

				// Consider as updates only changed values
				const nextAttributes = reduce( action.attributes, ( result, value, key ) => {
					if ( value !== result[ key ] ) {
						// Avoid mutating original block by creating shallow clone
						if ( result === state[ action.clientId ].attributes ) {
							result = { ...result };
						}

						result[ key ] = value;
					}

					return result;
				}, state[ action.clientId ].attributes );

				// Skip update if nothing has been changed. The reference will
				// match the original block if `reduce` had no changed values.
				if ( nextAttributes === state[ action.clientId ].attributes ) {
					return state;
				}

				// Otherwise merge attributes into state
				return {
					...state,
					[ action.clientId ]: {
						...state[ action.clientId ],
						attributes: nextAttributes,
					},
				};

			case 'MOVE_BLOCK_TO_POSITION':
				// Avoid creating a new instance if the layout didn't change.
				if ( state[ action.clientId ].attributes.layout === action.layout ) {
					return state;
				}

				return {
					...state,
					[ action.clientId ]: {
						...state[ action.clientId ],
						attributes: {
							...state[ action.clientId ].attributes,
							layout: action.layout,
						},
					},
				};

			case 'UPDATE_BLOCK':
				// Ignore updates if block isn't known
				if ( ! state[ action.clientId ] ) {
					return state;
				}

				return {
					...state,
					[ action.clientId ]: {
						...state[ action.clientId ],
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
					...omit( state, action.clientIds ),
					...getFlattenedBlocks( action.blocks ),
				};

			case 'REMOVE_BLOCKS':
				return omit( state, action.clientIds );

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
				const { rootClientId = '', blocks } = action;
				const subState = state[ rootClientId ] || [];
				const mappedBlocks = mapBlockOrder( blocks, rootClientId );
				const { index = subState.length } = action;

				return {
					...state,
					...mappedBlocks,
					[ rootClientId ]: insertAt( subState, mappedBlocks[ rootClientId ], index ),
				};
			}

			case 'MOVE_BLOCK_TO_POSITION': {
				const { fromRootClientId = '', toRootClientId = '', clientId } = action;
				const { index = state[ toRootClientId ].length } = action;

				// Moving inside the same parent block
				if ( fromRootClientId === toRootClientId ) {
					const subState = state[ toRootClientId ];
					const fromIndex = subState.indexOf( clientId );
					return {
						...state,
						[ toRootClientId ]: moveTo( state[ toRootClientId ], fromIndex, index ),
					};
				}

				// Moving from a parent block to another
				return {
					...state,
					[ fromRootClientId ]: without( state[ fromRootClientId ], clientId ),
					[ toRootClientId ]: insertAt( state[ toRootClientId ], clientId, index ),
				};
			}

			case 'MOVE_BLOCKS_UP': {
				const { clientIds, rootClientId = '' } = action;
				const firstClientId = first( clientIds );
				const subState = state[ rootClientId ];

				if ( ! subState.length || firstClientId === first( subState ) ) {
					return state;
				}

				const firstIndex = subState.indexOf( firstClientId );

				return {
					...state,
					[ rootClientId ]: moveTo( subState, firstIndex, firstIndex - 1, clientIds.length ),
				};
			}

			case 'MOVE_BLOCKS_DOWN': {
				const { clientIds, rootClientId = '' } = action;
				const firstClientId = first( clientIds );
				const lastClientId = last( clientIds );
				const subState = state[ rootClientId ];

				if ( ! subState.length || lastClientId === last( subState ) ) {
					return state;
				}

				const firstIndex = subState.indexOf( firstClientId );

				return {
					...state,
					[ rootClientId ]: moveTo( subState, firstIndex, firstIndex + 1, clientIds.length ),
				};
			}

			case 'REPLACE_BLOCKS': {
				const { blocks, clientIds } = action;
				if ( ! blocks ) {
					return state;
				}

				const mappedBlocks = mapBlockOrder( blocks );

				return flow( [
					( nextState ) => omit( nextState, clientIds ),
					( nextState ) => ( {
						...nextState,
						...omit( mappedBlocks, '' ),
					} ),
					( nextState ) => mapValues( nextState, ( subState ) => (
						reduce( subState, ( result, clientId ) => {
							if ( clientId === clientIds[ 0 ] ) {
								return [
									...result,
									...mappedBlocks[ '' ],
								];
							}

							if ( clientIds.indexOf( clientId ) === -1 ) {
								result.push( clientId );
							}

							return result;
						}, [] )
					) ),
				] )( state );
			}

			case 'REMOVE_BLOCKS':
				return flow( [
					// Remove inner block ordering for removed blocks
					( nextState ) => omit( nextState, action.clientIds ),

					// Remove deleted blocks from other blocks' orderings
					( nextState ) => mapValues( nextState, ( subState ) => (
						without( subState, ...action.clientIds )
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
			if ( action.clientId === state.start && action.clientId === state.end ) {
				return state;
			}
			return {
				...state,
				start: action.clientId,
				end: action.clientId,
				initialPosition: action.initialPosition,
			};
		case 'INSERT_BLOCKS':
			return {
				...state,
				start: action.blocks[ 0 ].clientId,
				end: action.blocks[ 0 ].clientId,
				initialPosition: null,
				isMultiSelecting: false,
			};
		case 'REMOVE_BLOCKS':
			if ( ! action.clientIds || ! action.clientIds.length || action.clientIds.indexOf( state.start ) === -1 ) {
				return state;
			}
			return {
				...state,
				start: null,
				end: null,
				initialPosition: null,
				isMultiSelecting: false,
			};
		case 'REPLACE_BLOCKS':
			if ( action.clientIds.indexOf( state.start ) === -1 ) {
				return state;
			}

			// If there is replacement block(s), assign first's client ID as
			// the next selected block. If empty replacement, reset to null.
			const nextSelectedBlockClientId = get( action.blocks, [ 0, 'clientId' ], null );

			return {
				...state,
				start: nextSelectedBlockClientId,
				end: nextSelectedBlockClientId,
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

export function blocksMode( state = {}, action ) {
	if ( action.type === 'TOGGLE_BLOCK_MODE' ) {
		const { clientId } = action;
		return {
			...state,
			[ clientId ]: state[ clientId ] && state[ clientId ] === 'html' ? 'visual' : 'html',
		};
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
		case 'SET_TEMPLATE_VALIDITY':
			return {
				...state,
				isValid: action.isValid,
			};
	}

	return state;
}

/**
 * Reducer returning the editor setting.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function settings( state = EDITOR_SETTINGS_DEFAULTS, action ) {
	switch ( action.type ) {
		case 'UPDATE_EDITOR_SETTINGS':
			return {
				...state,
				...action.settings,
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
		case 'REQUEST_POST_UPDATE_START':
			return {
				requesting: true,
				successful: false,
				error: null,
				isAutosave: action.isAutosave,
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
					const { clientId } = result.parsedBlock;

					const value = { clientId, title };

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

/**
 * Reducer returning an object where each key is a block client ID, its value
 * representing the settings for its nested blocks.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const blockListSettings = ( state = {}, action ) => {
	switch ( action.type ) {
		// Even if the replaced blocks have the same client ID, our logic
		// should correct the state.
		case 'REPLACE_BLOCKS' :
		case 'REMOVE_BLOCKS': {
			return omit( state, action.clientIds );
		}
		case 'UPDATE_BLOCK_LIST_SETTINGS': {
			const { clientId } = action;
			if ( ! action.settings ) {
				if ( state.hasOwnProperty( clientId ) ) {
					return omit( state, clientId );
				}

				return state;
			}

			if ( isEqual( state[ clientId ], action.settings ) ) {
				return state;
			}

			return {
				...state,
				[ clientId ]: action.settings,
			};
		}
	}
	return state;
};

/**
 * Reducer returning the most recent autosave.
 *
 * @param  {Object} state  The autosave object.
 * @param  {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function autosave( state = null, action ) {
	switch ( action.type ) {
		case 'RESET_AUTOSAVE':
			const { post } = action;
			const [ title, excerpt, content ] = [
				'title',
				'excerpt',
				'content',
			].map( ( field ) => getPostRawValue( post[ field ] ) );

			return {
				title,
				excerpt,
				content,
				preview_link: post.preview_link,
			};

		case 'REQUEST_POST_UPDATE':
			// Invalidate known preview link when autosave starts.
			if ( state && action.options.autosave ) {
				return omit( state, 'preview_link' );
			}
			break;
	}

	return state;
}

/**
 * Reducer managing the block types
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function tokens( state = {}, action ) {
	switch ( action.type ) {
		case 'REGISTER_TOKEN':
			return {
				...state,
				[ action.name ]: action.settings,
			};
		case 'UNREGISTER_TOKEN':
			return omit( state, action.name );
	}

	return state;
}

export default optimist( combineReducers( {
	editor,
	currentPost,
	isTyping,
	blockSelection,
	blocksMode,
	blockListSettings,
	isInsertionPointVisible,
	preferences,
	saving,
	notices,
	reusableBlocks,
	template,
	autosave,
	settings,
	tokens,
} ) );
