/**
 * External dependencies
 */
import {
	flow,
	reduce,
	first,
	last,
	omit,
	without,
	mapValues,
	keys,
	isEqual,
	isEmpty,
	identity,
	difference,
	omitBy,
	pickBy,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';
import { isReusableBlock } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS, SETTINGS_DEFAULTS } from './defaults';
import { insertAt, moveTo } from './array';

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
 * Given an array of blocks, returns an object where each key contains
 * the clientId of the block and the value is the parent of the block.
 *
 * @param {Array}   blocks       Blocks to map.
 * @param {?string} rootClientId Assumed root client ID.
 *
 * @return {Object} Block order map object.
 */
function mapBlockParents( blocks, rootClientId = '' ) {
	return blocks.reduce(
		( result, block ) =>
			Object.assign(
				result,
				{ [ block.clientId ]: rootClientId },
				mapBlockParents( block.innerBlocks, block.clientId )
			),
		{}
	);
}

/**
 * Helper method to iterate through all blocks, recursing into inner blocks,
 * applying a transformation function to each one.
 * Returns a flattened object with the transformed blocks.
 *
 * @param {Array} blocks Blocks to flatten.
 * @param {Function} transform Transforming function to be applied to each block.
 *
 * @return {Object} Flattened object.
 */
function flattenBlocks( blocks, transform = identity ) {
	const result = {};

	const stack = [ ...blocks ];
	while ( stack.length ) {
		const { innerBlocks, ...block } = stack.shift();
		stack.push( ...innerBlocks );
		result[ block.clientId ] = transform( block );
	}

	return result;
}

/**
 * Given an array of blocks, returns an object containing all blocks, without
 * attributes, recursing into inner blocks. Keys correspond to the block client
 * ID, the value of which is the attributes object.
 *
 * @param {Array} blocks Blocks to flatten.
 *
 * @return {Object} Flattened block attributes object.
 */
function getFlattenedBlocksWithoutAttributes( blocks ) {
	return flattenBlocks( blocks, ( block ) => omit( block, 'attributes' ) );
}

/**
 * Given an array of blocks, returns an object containing all block attributes,
 * recursing into inner blocks. Keys correspond to the block client ID, the
 * value of which is the attributes object.
 *
 * @param {Array} blocks Blocks to flatten.
 *
 * @return {Object} Flattened block attributes object.
 */
function getFlattenedBlockAttributes( blocks ) {
	return flattenBlocks( blocks, ( block ) => block.attributes );
}

/**
 * Given a block order map object, returns *all* of the block client IDs that are
 * a descendant of the given root client ID.
 *
 * Calling this with `rootClientId` set to `''` results in a list of client IDs
 * that are in the post. That is, it excludes blocks like fetched reusable
 * blocks which are stored into state but not visible. It also excludes
 * InnerBlocks controllers, like template parts.
 *
 * It is important to exclude the full inner block controller and not just the
 * inner blocks because in many cases, we need to persist the previous value of
 * an inner block controller. To do so, it must be excluded from the list of
 * client IDs which are considered to be part of the top-level entity.
 *
 * @param {Object}  blocksOrder  Object that maps block client IDs to a list of
 *                               nested block client IDs.
 * @param {?string} rootClientId The root client ID to search. Defaults to ''.
 * @param {?Object} controlledInnerBlocks The InnerBlocks controller state.
 *
 * @return {Array} List of descendant client IDs.
 */
function getNestedBlockClientIds(
	blocksOrder,
	rootClientId = '',
	controlledInnerBlocks = {}
) {
	return reduce(
		blocksOrder[ rootClientId ],
		( result, clientId ) => {
			if ( !! controlledInnerBlocks[ clientId ] ) {
				return result;
			}
			return [
				...result,
				clientId,
				...getNestedBlockClientIds( blocksOrder, clientId ),
			];
		},
		[]
	);
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
 * @param {Object} action     Currently dispatching action.
 * @param {Object} lastAction Previously dispatched action.
 *
 * @return {boolean} Whether actions are updating the same block attribute.
 */
export function isUpdatingSameBlockAttribute( action, lastAction ) {
	return (
		action.type === 'UPDATE_BLOCK_ATTRIBUTES' &&
		lastAction !== undefined &&
		lastAction.type === 'UPDATE_BLOCK_ATTRIBUTES' &&
		isEqual( action.clientIds, lastAction.clientIds ) &&
		hasSameKeys( action.attributes, lastAction.attributes )
	);
}

/**
 * Utility returning an object with an empty object value for each key.
 *
 * @param {Array} objectKeys Keys to fill.
 * @return {Object} Object filled with empty object as values for each clientId.
 */
const fillKeysWithEmptyObject = ( objectKeys ) => {
	return objectKeys.reduce( ( result, key ) => {
		result[ key ] = {};
		return result;
	}, {} );
};

/**
 * Higher-order reducer intended to compute a cache key for each block in the post.
 * A new instance of the cache key (empty object) is created each time the block object
 * needs to be refreshed (for any change in the block or its children).
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withBlockCache = ( reducer ) => ( state = {}, action ) => {
	const newState = reducer( state, action );

	if ( newState === state ) {
		return state;
	}
	newState.cache = state.cache ? state.cache : {};

	/**
	 * For each clientId provided, traverses up parents, adding the provided clientIds
	 * and each parent's clientId to the returned array.
	 *
	 * When calling this function consider that it uses the old state, so any state
	 * modifications made by the `reducer` will not be present.
	 *
	 * @param {Array} clientIds an Array of block clientIds.
	 *
	 * @return {Array} The provided clientIds and all of their parent clientIds.
	 */
	const getBlocksWithParentsClientIds = ( clientIds ) => {
		return clientIds.reduce( ( result, clientId ) => {
			let current = clientId;
			do {
				result.push( current );
				current = state.parents[ current ];
			} while ( current && ! state.controlledInnerBlocks[ current ] );
			return result;
		}, [] );
	};

	switch ( action.type ) {
		case 'SAVE_REUSABLE_BLOCK_SUCCESS': {
			const updatedBlockUids = keys(
				omitBy( newState.attributes, ( attributes, clientId ) => {
					return (
						newState.byClientId[ clientId ].name !== 'core/block' ||
						attributes.ref !== action.updatedId
					);
				} )
			);

			newState.cache = {
				...newState.cache,
				...fillKeysWithEmptyObject(
					getBlocksWithParentsClientIds( updatedBlockUids )
				),
			};
		}
	}

	return newState;
};

/**
 * Higher-order reducer intended to augment the blocks reducer, assigning an
 * `isPersistentChange` property value corresponding to whether a change in
 * state can be considered as persistent. All changes are considered persistent
 * except when updating the same block attribute as in the previous action.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
function withPersistentBlockChange( reducer ) {
	let lastAction;
	let markNextChangeAsNotPersistent = false;

	return ( state, action ) => {
		let nextState = reducer( state, action );

		const isExplicitPersistentChange =
			action.type === 'MARK_LAST_CHANGE_AS_PERSISTENT' ||
			markNextChangeAsNotPersistent;

		// Defer to previous state value (or default) unless changing or
		// explicitly marking as persistent.
		if ( state === nextState && ! isExplicitPersistentChange ) {
			markNextChangeAsNotPersistent =
				action.type === 'MARK_NEXT_CHANGE_AS_NOT_PERSISTENT';

			const nextIsPersistentChange = state?.isPersistentChange ?? true;
			if ( state.isPersistentChange === nextIsPersistentChange ) {
				return state;
			}

			return {
				...nextState,
				isPersistentChange: nextIsPersistentChange,
			};
		}

		nextState = {
			...nextState,
			isPersistentChange: isExplicitPersistentChange
				? ! markNextChangeAsNotPersistent
				: ! isUpdatingSameBlockAttribute( action, lastAction ),
		};

		// In comparing against the previous action, consider only those which
		// would have qualified as one which would have been ignored or not
		// have resulted in a changed state.
		lastAction = action;
		markNextChangeAsNotPersistent =
			action.type === 'MARK_NEXT_CHANGE_AS_NOT_PERSISTENT';

		return nextState;
	};
}

/**
 * Higher-order reducer intended to augment the blocks reducer, assigning an
 * `isIgnoredChange` property value corresponding to whether a change in state
 * can be considered as ignored. A change is considered ignored when the result
 * of an action not incurred by direct user interaction.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
function withIgnoredBlockChange( reducer ) {
	/**
	 * Set of action types for which a blocks state change should be ignored.
	 *
	 * @type {Set}
	 */
	const IGNORED_ACTION_TYPES = new Set( [ 'RECEIVE_BLOCKS' ] );

	return ( state, action ) => {
		const nextState = reducer( state, action );

		if ( nextState !== state ) {
			nextState.isIgnoredChange = IGNORED_ACTION_TYPES.has( action.type );
		}

		return nextState;
	};
}

/**
 * Higher-order reducer which targets the combined blocks reducer and handles
 * the `REPLACE_INNER_BLOCKS` action. When dispatched, this action the state
 * should become equivalent to the execution of a `REMOVE_BLOCKS` action
 * containing all the child's of the root block followed by the execution of
 * `INSERT_BLOCKS` with the new blocks.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withReplaceInnerBlocks = ( reducer ) => ( state, action ) => {
	if ( action.type !== 'REPLACE_INNER_BLOCKS' ) {
		return reducer( state, action );
	}
};

/**
 * Higher-order reducer which targets the combined blocks reducer and handles
 * the `SAVE_REUSABLE_BLOCK_SUCCESS` action. This action can't be handled by
 * regular reducers and needs a higher-order reducer since it needs access to
 * both `byClientId` and `attributes` simultaneously.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withSaveReusableBlock = ( reducer ) => ( state, action ) => {
	if ( state && action.type === 'SAVE_REUSABLE_BLOCK_SUCCESS' ) {
		const { id, updatedId } = action;

		// If a temporary reusable block is saved, we swap the temporary id with the final one
		if ( id === updatedId ) {
			return state;
		}

		state = { ...state };

		state.attributes = mapValues(
			state.attributes,
			( attributes, clientId ) => {
				const { name } = state.byClientId[ clientId ];
				if ( name === 'core/block' && attributes.ref === id ) {
					return {
						...attributes,
						ref: updatedId,
					};
				}

				return attributes;
			}
		);
	}

	return reducer( state, action );
};

/**
 * Reducer returning the blocks state.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const blocks = flow(
	combineReducers,
	withSaveReusableBlock, // needs to be before withBlockCache
	withBlockCache, // needs to be before withInnerBlocksRemoveCascade
	withInnerBlocksRemoveCascade,
	withReplaceInnerBlocks, // needs to be after withInnerBlocksRemoveCascade
	withPersistentBlockChange,
	withIgnoredBlockChange
)( {
	controlledInnerBlocks(
		state = {},
		{ type, clientId, hasControlledInnerBlocks }
	) {
		if ( type === 'SET_HAS_CONTROLLED_INNER_BLOCKS' ) {
			return {
				...state,
				[ clientId ]: hasControlledInnerBlocks,
			};
		}
		return state;
	},
} );

/**
 * Internal helper reducer for selectionStart and selectionEnd. Can hold a block
 * selection, represented by an object with property clientId.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
function selection( state = {}, action ) {
	switch ( action.type ) {
		case 'REPLACE_INNER_BLOCKS': // REPLACE_INNER_BLOCKS and INSERT_BLOCKS should follow the same logic.
		case 'INSERT_BLOCKS': {
			// REPLACE_INNER_BLOCKS can be called with an empty array.
			if ( ! action.updateSelection || ! action.blocks.length ) {
				return state;
			}

			return { clientId: action.blocks[ 0 ].clientId };
		}
	}

	return state;
}

/**
 * Reducer returning the block selection's start.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function selectionStart( state = {}, action ) {
	return selection( state, action );
}

/**
 * Reducer returning the block selection's end.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function selectionEnd( state = {}, action ) {
	return selection( state, action );
}

/**
 * Reducer returning whether selection is enabled.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function isSelectionEnabled( state = true, action ) {
	switch ( action.type ) {
		case 'TOGGLE_SELECTION':
			return action.isSelectionEnabled;
	}

	return state;
}

/**
 * Reducer returning the intial block selection.
 *
 * Currently this in only used to restore the selection after block deletion and
 * pasting new content.This reducer should eventually be removed in favour of setting
 * selection directly.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {?number} Initial position: -1 or undefined.
 */
export function initialPosition( state, action ) {
	if ( action.type === 'REMOVE_BLOCKS' ) {
		return state;
	} else if ( action.type === 'START_TYPING' ) {
		return state;
	}

	// Reset the state by default (for any action not handled).
}

/**
 * A helper for resetting the insertion point state.
 *
 * @param {Object} state        Current state.
 * @param {Object} action       Dispatched action.
 * @param {*}      defaultValue The default value for the reducer.
 *
 * @return {*} Either the default value if a reset is required, or the state.
 */
function resetInsertionPoint( state, action, defaultValue ) {
	switch ( action.type ) {
		case 'REPLACE_INNER_BLOCKS':
			return defaultValue;
	}

	return state;
}

/**
 * Reducer returning the insertion point position, consisting of the
 * rootClientId and an index.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function insertionPoint( state = null, action ) {
	switch ( action.type ) {
	}

	return resetInsertionPoint( state, action, null );
}

/**
 * Reducer returning the visibility of the insertion point.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function insertionPointVisibility( state = false, action ) {
	switch ( action.type ) {
	}

	return resetInsertionPoint( state, action, false );
}

/**
 * Reducer returning the editor setting.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function settings( state = SETTINGS_DEFAULTS, action ) {
	switch ( action.type ) {
		case 'UPDATE_SETTINGS':
			return {
				...state,
				...action.settings,
			};
	}

	return state;
}

/**
 * Reducer returning whether the navigation mode is enabled or not.
 *
 * @param {string} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function isNavigationMode( state = false, action ) {
	if ( action.type === 'SET_NAVIGATION_MODE' ) {
		return action.isNavigationMode;
	}

	return state;
}

/**
 * Reducer returning whether the block moving mode is enabled or not.
 *
 * @param {string|null} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {string|null} Updated state.
 */
export function hasBlockMovingClientId( state = null, action ) {
	// Let inserting block always trigger Edit mode.

	if ( action.type === 'SET_BLOCK_MOVING_MODE' ) {
		return action.hasBlockMovingClientId;
	}

	return state;
}

/**
 * Reducer return an updated state representing the most recent block attribute
 * update. The state is structured as an object where the keys represent the
 * client IDs of blocks, the values a subset of attributes from the most recent
 * block update. The state is always reset to null if the last action is
 * anything other than an attributes update.
 *
 * @param {Object<string,Object>} state  Current state.
 * @param {Object}                action Action object.
 *
 * @return {[string,Object]} Updated state.
 */
export function lastBlockAttributesChange( state, action ) {
	switch ( action.type ) {
		case 'UPDATE_BLOCK':
			if ( ! action.updates.attributes ) {
				break;
			}

			return { [ action.clientId ]: action.updates.attributes };

		case 'UPDATE_BLOCK_ATTRIBUTES':
			return action.clientIds.reduce(
				( accumulator, id ) => ( {
					...accumulator,
					[ id ]: action.attributes,
				} ),
				{}
			);
	}

	return null;
}

/**
 * Reducer returning automatic change state.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function automaticChangeStatus( state, action ) {
	switch ( action.type ) {
		case 'MARK_AUTOMATIC_CHANGE':
			return 'pending';
		case 'MARK_AUTOMATIC_CHANGE_FINAL':
			if ( state === 'pending' ) {
				return 'final';
			}

			return;
		case 'SELECTION_CHANGE':
			// As long as the state is not final, ignore any selection changes.
			if ( state !== 'final' ) {
				return state;
			}

			return;
		// Undoing an automatic change should still be possible after mouse
		// move.
		case 'START_TYPING':
		case 'STOP_TYPING':
			return state;
	}

	// Reset the state by default (for any action not handled).
}

/**
 * Reducer returning current highlighted block.
 *
 * @param {boolean} state  Current highlighted block.
 * @param {Object}  action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function highlightedBlock( state, action ) {
	switch ( action.type ) {
		case 'TOGGLE_BLOCK_HIGHLIGHT':
			const { clientId, isHighlighted } = action;

			if ( isHighlighted ) {
				return clientId;
			} else if ( state === clientId ) {
				return null;
			}

			return state;
	}

	return state;
}

export default combineReducers( {
	blocks,
	isTyping,
	draggedBlocks,
	isCaretWithinFormattedText,
	selectionStart,
	selectionEnd,
	isSelectionEnabled,
	initialPosition,
	blocksMode,
	blockListSettings,
	insertionPoint,
	insertionPointVisibility,
	template,
	settings,
	preferences,
	lastBlockAttributesChange,
	isNavigationMode,
	hasBlockMovingClientId,
	automaticChangeStatus,
	highlightedBlock,
} );
