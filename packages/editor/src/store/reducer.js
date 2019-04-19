/**
 * External dependencies
 */
import optimist from 'redux-optimist';
import {
	flow,
	reduce,
	omit,
	mapValues,
	keys,
	isEqual,
	last,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	PREFERENCES_DEFAULTS,
	INITIAL_EDITS_DEFAULTS,
	EDITOR_SETTINGS_DEFAULTS,
} from './defaults';
import { EDIT_MERGE_PROPERTIES } from './constants';
import withChangeDetection from '../utils/with-change-detection';
import withHistory from '../utils/with-history';

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
 * Returns an object against which it is safe to perform mutating operations,
 * given the original object and its current working copy.
 *
 * @param {Object} original Original object.
 * @param {Object} working  Working object.
 *
 * @return {Object} Mutation-safe object.
 */
function getMutateSafeObject( original, working ) {
	if ( original === working ) {
		return { ...original };
	}

	return working;
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

/**
 * Undoable reducer returning the editor post state, including blocks parsed
 * from current HTML markup.
 *
 * Handles the following state keys:
 *  - edits: an object describing changes to be made to the current post, in
 *           the format accepted by the WP REST API
 *  - blocks: post content blocks
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @returns {Object} Updated state.
 */
export const editor = flow( [
	combineReducers,

	withHistory( {
		resetTypes: [ 'SETUP_EDITOR_STATE' ],
		ignoreTypes: [
			'RESET_POST',
			'UPDATE_POST',
		],
		shouldOverwriteState,
	} ),
] )( {
	// Track whether changes exist, resetting at each post save. Relies on
	// editor initialization firing post reset as an effect.
	blocks: withChangeDetection( {
		resetTypes: [ 'SETUP_EDITOR_STATE', 'REQUEST_POST_UPDATE_START' ],
	} )( ( state = { value: [] }, action ) => {
		switch ( action.type ) {
			case 'RESET_EDITOR_BLOCKS':
				if ( action.blocks === state.value ) {
					return state;
				}
				return { value: action.blocks };
		}

		return state;
	} ),
	edits( state = {}, action ) {
		switch ( action.type ) {
			case 'EDIT_POST':
				return reduce( action.edits, ( result, value, key ) => {
					// Only assign into result if not already same value
					if ( value !== state[ key ] ) {
						result = getMutateSafeObject( state, result );

						if ( EDIT_MERGE_PROPERTIES.has( key ) ) {
							// Merge properties should assign to current value.
							result[ key ] = { ...result[ key ], ...value };
						} else {
							// Otherwise override.
							result[ key ] = value;
						}
					}

					return result;
				}, state );
			case 'UPDATE_POST':
			case 'RESET_POST':
				const getCanonicalValue = action.type === 'UPDATE_POST' ?
					( key ) => action.edits[ key ] :
					( key ) => getPostRawValue( action.post[ key ] );

				return reduce( state, ( result, value, key ) => {
					if ( ! isEqual( value, getCanonicalValue( key ) ) ) {
						return result;
					}

					result = getMutateSafeObject( state, result );
					delete result[ key ];
					return result;
				}, state );
			case 'RESET_EDITOR_BLOCKS':
				if ( 'content' in state ) {
					return omit( state, 'content' );
				}

				return state;
		}

		return state;
	},
} );

/**
 * Reducer returning the initial edits state. With matching shape to that of
 * `editor.edits`, the initial edits are those applied programmatically, are
 * not considered in prompting the user for unsaved changes, and are included
 * in (and reset by) the next save payload.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Action object.
 *
 * @return {Object} Next state.
 */
export function initialEdits( state = INITIAL_EDITS_DEFAULTS, action ) {
	switch ( action.type ) {
		case 'SETUP_EDITOR':
			if ( ! action.edits ) {
				break;
			}

			return action.edits;

		case 'SETUP_EDITOR_STATE':
			if ( 'content' in state ) {
				return omit( state, 'content' );
			}

			return state;

		case 'UPDATE_POST':
			return reduce( action.edits, ( result, value, key ) => {
				if ( ! result.hasOwnProperty( key ) ) {
					return result;
				}

				result = getMutateSafeObject( state, result );
				delete result[ key ];
				return result;
			}, state );

		case 'RESET_POST':
			return INITIAL_EDITS_DEFAULTS;
	}

	return state;
}

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
 * Reducer returning whether the caret is within formatted text.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function isCaretWithinFormattedText( state = false, action ) {
	switch ( action.type ) {
		case 'ENTER_FORMATTED_TEXT':
			return true;

		case 'EXIT_FORMATTED_TEXT':
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
		case 'INSERT_BLOCKS': {
			if ( action.updateSelection ) {
				return {
					...state,
					start: action.blocks[ 0 ].clientId,
					end: action.blocks[ 0 ].clientId,
					initialPosition: null,
					isMultiSelecting: false,
				};
			}
			return state;
		}
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

			// If there are replacement blocks, assign last block as the next
			// selected block, otherwise set to null.
			const lastBlock = last( action.blocks );
			const nextSelectedBlockClientId = lastBlock ? lastBlock.clientId : null;

			if ( nextSelectedBlockClientId === state.start && nextSelectedBlockClientId === state.end ) {
				return state;
			}

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
 * Reducer returning the block insertion point visibility, either null if there
 * is not an explicit insertion point assigned, or an object of its `index` and
 * `rootClientId`.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function insertionPoint( state = null, action ) {
	switch ( action.type ) {
		case 'SHOW_INSERTION_POINT':
			const { rootClientId, index } = action;
			return { rootClientId, index };

		case 'HIDE_INSERTION_POINT':
			return null;
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
 * @param {Object}  state                 Current state.
 * @param {Object}  action                Dispatched action.
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
			return {
				requesting: true,
				successful: false,
				error: null,
				options: action.options || {},
			};

		case 'REQUEST_POST_UPDATE_SUCCESS':
			return {
				requesting: false,
				successful: true,
				error: null,
				options: action.options || {},
			};

		case 'REQUEST_POST_UPDATE_FAILURE':
			return {
				requesting: false,
				successful: false,
				error: action.error,
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
 * @property {boolean} isLocked       Whether the post is locked.
 * @property {?boolean} isTakeover     Whether the post editing has been taken over.
 * @property {?boolean} activePostLock Active post lock value.
 * @property {?Object}  user           User that took over the post.
 */

/**
 * Reducer returning the post lock status.
 *
 * @param {PostLockState} state  Current state.
 * @param {Object} action Dispatched action.
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
 * @param {PostSavingLockState} state  Current state.
 * @param {Object}              action Dispatched action.
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

export const reusableBlocks = combineReducers( {
	data( state = {}, action ) {
		switch ( action.type ) {
			case 'RECEIVE_REUSABLE_BLOCKS': {
				return reduce( action.results, ( nextState, result ) => {
					const { id, title } = result.reusableBlock;
					const { clientId } = result.parsedBlock;

					const value = { clientId, title };

					if ( ! isEqual( nextState[ id ], value ) ) {
						nextState = getMutateSafeObject( state, nextState );
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
 * Reducer returning the post preview link.
 *
 * @param {string?} state  The preview link.
 * @param {Object}  action Dispatched action.
 *
 * @return {string?} Updated state.
 */
export function previewLink( state = null, action ) {
	switch ( action.type ) {
		case 'REQUEST_POST_UPDATE_SUCCESS':
			if ( action.post.preview_link ) {
				return action.post.preview_link;
			} else if ( action.post.link ) {
				return addQueryArgs( action.post.link, { preview: true } );
			}

			return state;

		case 'REQUEST_POST_UPDATE_START':
			// Invalidate known preview link when autosave starts.
			if ( state && action.options.isPreview ) {
				return null;
			}
			break;
	}

	return state;
}

/**
 * Reducer returning whether the editor is ready to be rendered.
 * The editor is considered ready to be rendered once
 * the post object is loaded properly and the initial blocks parsed.
 *
 * @param {boolean} state
 * @param {Object} action
 *
 * @return {boolean} Updated state.
 */
export function isReady( state = false, action ) {
	switch ( action.type ) {
		case 'SETUP_EDITOR_STATE':
			return true;
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

export default optimist( combineReducers( {
	editor,
	initialEdits,
	currentPost,
	preferences,
	saving,
	postLock,
	reusableBlocks,
	template,
	previewLink,
	postSavingLock,
	isReady,
	editorSettings,
} ) );
