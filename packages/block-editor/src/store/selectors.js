/**
 * External dependencies
 */
import {
	castArray,
	flatMap,
	first,
	get,
	includes,
	isArray,
	isBoolean,
	last,
	map,
	orderBy,
	reduce,
	some,
} from 'lodash';
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import {
	getBlockType,
	getBlockTypes,
	hasBlockSupport,
	hasChildBlocksWithInserterSupport,
} from '@wordpress/blocks';

/***
 * Module constants
 */
export const INSERTER_UTILITY_HIGH = 3;
export const INSERTER_UTILITY_MEDIUM = 2;
export const INSERTER_UTILITY_LOW = 1;
export const INSERTER_UTILITY_NONE = 0;
const MILLISECONDS_PER_HOUR = 3600 * 1000;
const MILLISECONDS_PER_DAY = 24 * 3600 * 1000;
const MILLISECONDS_PER_WEEK = 7 * 24 * 3600 * 1000;

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation, as in a connected or
 * other pure component which performs `shouldComponentUpdate` check on props.
 * This should be used as a last resort, since the normalized data should be
 * maintained by the reducer result in state.
 *
 * @type {Array}
 */
const EMPTY_ARRAY = [];

/**
 * Shared reference to an empty object for cases where it is important to avoid
 * returning a new object reference on every invocation.
 *
 * @type {Object}
 */
const EMPTY_OBJECT = {};

/**
 * Returns a new reference when the inner blocks of a given block client ID
 * change. This is used exclusively as a memoized selector dependant, relying
 * on this selector's shared return value and recursively those of its inner
 * blocks defined as dependencies. This abuses mechanics of the selector
 * memoization to return from the original selector function only when
 * dependants change.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {*} A value whose reference will change only when inner blocks of
 *             the given block client ID change.
 */
export const getBlockDependantsCacheBust = createSelector(
	() => [],
	( state, clientId ) => map(
		getBlockOrder( state, clientId ),
		( innerBlockClientId ) => getBlock( state, innerBlockClientId ),
	),
);

/**
 * Returns a block's name given its client ID, or null if no block exists with
 * the client ID.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {string} Block name.
 */
export function getBlockName( state, clientId ) {
	const block = state.blocks.byClientId[ clientId ];
	return block ? block.name : null;
}

/**
 * Returns whether a block is valid or not.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {boolean} Is Valid.
 */
export function isBlockValid( state, clientId ) {
	const block = state.blocks.byClientId[ clientId ];
	return !! block && block.isValid;
}

/**
 * Returns a block's attributes given its client ID, or null if no block exists with
 * the client ID.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {Object?} Block attributes.
 */
export const getBlockAttributes = createSelector(
	( state, clientId ) => {
		const block = state.blocks.byClientId[ clientId ];
		if ( ! block ) {
			return null;
		}

		let attributes = state.blocks.attributes[ clientId ];

		// Inject custom source attribute values.
		//
		// TODO: Create generic external sourcing pattern, not explicitly
		// targeting meta attributes.
		const type = getBlockType( block.name );
		if ( type ) {
			attributes = reduce( type.attributes, ( result, value, key ) => {
				if ( value.source === 'meta' ) {
					if ( result === attributes ) {
						result = { ...result };
					}

					result[ key ] = getPostMeta( state, value.meta );
				}

				return result;
			}, attributes );
		}

		return attributes;
	},
	( state, clientId ) => [
		state.blocks.byClientId[ clientId ],
		state.blocks.attributes[ clientId ],
		getPostMeta( state ),
	]
);

/**
 * Returns a block given its client ID. This is a parsed copy of the block,
 * containing its `blockName`, `clientId`, and current `attributes` state. This
 * is not the block's registration settings, which must be retrieved from the
 * blocks module registration store.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {Object} Parsed block object.
 */
export const getBlock = createSelector(
	( state, clientId ) => {
		const block = state.blocks.byClientId[ clientId ];
		if ( ! block ) {
			return null;
		}

		return {
			...block,
			attributes: getBlockAttributes( state, clientId ),
			innerBlocks: getBlocks( state, clientId ),
		};
	},
	( state, clientId ) => [
		...getBlockAttributes.getDependants( state, clientId ),
		getBlockDependantsCacheBust( state, clientId ),
	]
);

export const __unstableGetBlockWithoutInnerBlocks = createSelector(
	( state, clientId ) => {
		const block = state.blocks.byClientId[ clientId ];
		if ( ! block ) {
			return null;
		}

		return {
			...block,
			attributes: getBlockAttributes( state, clientId ),
		};
	},
	( state, clientId ) => [
		state.blocks.byClientId[ clientId ],
		...getBlockAttributes.getDependants( state, clientId ),
	]
);

/**
 * Returns all block objects for the current post being edited as an array in
 * the order they appear in the post.
 *
 * Note: It's important to memoize this selector to avoid return a new instance
 * on each call
 *
 * @param {Object}  state        Editor state.
 * @param {?String} rootClientId Optional root client ID of block list.
 *
 * @return {Object[]} Post blocks.
 */
export const getBlocks = createSelector(
	( state, rootClientId ) => {
		return map(
			getBlockOrder( state, rootClientId ),
			( clientId ) => getBlock( state, clientId )
		);
	},
	( state ) => [
		state.blocks.byClientId,
		state.blocks.order,
		state.blocks.attributes,
	]
);

/**
 * Returns an array containing the clientIds of all descendants
 * of the blocks given.
 *
 * @param {Object} state Global application state.
 * @param {Array} clientIds Array of blocks to inspect.
 *
 * @return {Array} ids of descendants.
 */
export const getClientIdsOfDescendants = ( state, clientIds ) => flatMap( clientIds, ( clientId ) => {
	const descendants = getBlockOrder( state, clientId );
	return [ ...descendants, ...getClientIdsOfDescendants( state, descendants ) ];
} );

/**
 * Returns an array containing the clientIds of the top-level blocks
 * and their descendants of any depth (for nested blocks).
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} ids of top-level and descendant blocks.
 */
export const getClientIdsWithDescendants = createSelector(
	( state ) => {
		const topLevelIds = getBlockOrder( state );
		return [ ...topLevelIds, ...getClientIdsOfDescendants( state, topLevelIds ) ];
	},
	( state ) => [
		state.blocks.order,
	]
);

/**
 * Returns the total number of blocks, or the total number of blocks with a specific name in a post.
 * The number returned includes nested blocks.
 *
 * @param {Object}  state     Global application state.
 * @param {?String} blockName Optional block name, if specified only blocks of that type will be counted.
 *
 * @return {number} Number of blocks in the post, or number of blocks with name equal to blockName.
 */
export const getGlobalBlockCount = createSelector(
	( state, blockName ) => {
		const clientIds = getClientIdsWithDescendants( state );
		if ( ! blockName ) {
			return clientIds.length;
		}
		return reduce( clientIds, ( count, clientId ) => {
			const block = state.blocks.byClientId[ clientId ];
			return block.name === blockName ? count + 1 : count;
		}, 0 );
	},
	( state ) => [
		state.blocks.order,
		state.blocks.byClientId,
	]
);

/**
 * Given an array of block client IDs, returns the corresponding array of block
 * objects.
 *
 * @param {Object}   state     Editor state.
 * @param {string[]} clientIds Client IDs for which blocks are to be returned.
 *
 * @return {WPBlock[]} Block objects.
 */
export const getBlocksByClientId = createSelector(
	( state, clientIds ) => map(
		castArray( clientIds ),
		( clientId ) => getBlock( state, clientId )
	),
	( state ) => [
		getPostMeta( state ),
		state.blocks.byClientId,
		state.blocks.order,
		state.blocks.attributes,
	]
);

/**
 * Returns the number of blocks currently present in the post.
 *
 * @param {Object}  state        Editor state.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {number} Number of blocks in the post.
 */
export function getBlockCount( state, rootClientId ) {
	return getBlockOrder( state, rootClientId ).length;
}

/**
 * Returns the current block selection start. This value may be null, and it
 * may represent either a singular block selection or multi-selection start.
 * A selection is singular if its start and end match.
 *
 * @param {Object} state Global application state.
 *
 * @return {?string} Client ID of block selection start.
 */
export function getBlockSelectionStart( state ) {
	return state.blockSelection.start;
}

/**
 * Returns the current block selection end. This value may be null, and it
 * may represent either a singular block selection or multi-selection end.
 * A selection is singular if its start and end match.
 *
 * @param {Object} state Global application state.
 *
 * @return {?string} Client ID of block selection end.
 */
export function getBlockSelectionEnd( state ) {
	return state.blockSelection.end;
}

/**
 * Returns the number of blocks currently selected in the post.
 *
 * @param {Object} state Global application state.
 *
 * @return {number} Number of blocks selected in the post.
 */
export function getSelectedBlockCount( state ) {
	const multiSelectedBlockCount = getMultiSelectedBlockClientIds( state ).length;

	if ( multiSelectedBlockCount ) {
		return multiSelectedBlockCount;
	}

	return state.blockSelection.start ? 1 : 0;
}

/**
 * Returns true if there is a single selected block, or false otherwise.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Whether a single block is selected.
 */
export function hasSelectedBlock( state ) {
	const { start, end } = state.blockSelection;
	return !! start && start === end;
}

/**
 * Returns the currently selected block client ID, or null if there is no
 * selected block.
 *
 * @param {Object} state Editor state.
 *
 * @return {?string} Selected block client ID.
 */
export function getSelectedBlockClientId( state ) {
	const { start, end } = state.blockSelection;
	// We need to check the block exists because the current blockSelection
	// reducer doesn't take into account when blocks are reset via undo. To be
	// removed when that's fixed.
	return start && start === end && !! state.blocks.byClientId[ start ] ? start : null;
}

/**
 * Returns the currently selected block, or null if there is no selected block.
 *
 * @param {Object} state Global application state.
 *
 * @return {?Object} Selected block.
 */
export function getSelectedBlock( state ) {
	const clientId = getSelectedBlockClientId( state );
	return clientId ? getBlock( state, clientId ) : null;
}

/**
 * Given a block client ID, returns the root block from which the block is
 * nested, an empty string for top-level blocks, or null if the block does not
 * exist.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block from which to find root client ID.
 *
 * @return {?string} Root client ID, if exists
 */
export const getBlockRootClientId = createSelector(
	( state, clientId ) => {
		const { order } = state.blocks;

		for ( const rootClientId in order ) {
			if ( includes( order[ rootClientId ], clientId ) ) {
				return rootClientId;
			}
		}

		return null;
	},
	( state ) => [
		state.blocks.order,
	]
);

/**
 * Given a block client ID, returns the root of the hierarchy from which the block is nested, return the block itself for root level blocks.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block from which to find root client ID.
 *
 * @return {string} Root client ID
 */
export const getBlockHierarchyRootClientId = createSelector(
	( state, clientId ) => {
		let rootClientId = clientId;
		let current = clientId;
		while ( rootClientId ) {
			current = rootClientId;
			rootClientId = getBlockRootClientId( state, current );
		}

		return current;
	},
	( state ) => [
		state.blocks.order,
	]
);

/**
 * Returns the client ID of the block adjacent one at the given reference
 * startClientId and modifier directionality. Defaults start startClientId to
 * the selected block, and direction as next block. Returns null if there is no
 * adjacent block.
 *
 * @param {Object}  state         Editor state.
 * @param {?string} startClientId Optional client ID of block from which to
 *                                search.
 * @param {?number} modifier      Directionality multiplier (1 next, -1
 *                                previous).
 *
 * @return {?string} Return the client ID of the block, or null if none exists.
 */
export function getAdjacentBlockClientId( state, startClientId, modifier = 1 ) {
	// Default to selected block.
	if ( startClientId === undefined ) {
		startClientId = getSelectedBlockClientId( state );
	}

	// Try multi-selection starting at extent based on modifier.
	if ( startClientId === undefined ) {
		if ( modifier < 0 ) {
			startClientId = getFirstMultiSelectedBlockClientId( state );
		} else {
			startClientId = getLastMultiSelectedBlockClientId( state );
		}
	}

	// Validate working start client ID.
	if ( ! startClientId ) {
		return null;
	}

	// Retrieve start block root client ID, being careful to allow the falsey
	// empty string top-level root by explicitly testing against null.
	const rootClientId = getBlockRootClientId( state, startClientId );
	if ( rootClientId === null ) {
		return null;
	}

	const { order } = state.blocks;
	const orderSet = order[ rootClientId ];
	const index = orderSet.indexOf( startClientId );
	const nextIndex = ( index + ( 1 * modifier ) );

	// Block was first in set and we're attempting to get previous.
	if ( nextIndex < 0 ) {
		return null;
	}

	// Block was last in set and we're attempting to get next.
	if ( nextIndex === orderSet.length ) {
		return null;
	}

	// Assume incremented index is within the set.
	return orderSet[ nextIndex ];
}

/**
 * Returns the previous block's client ID from the given reference start ID.
 * Defaults start to the selected block. Returns null if there is no previous
 * block.
 *
 * @param {Object}  state         Editor state.
 * @param {?string} startClientId Optional client ID of block from which to
 *                                search.
 *
 * @return {?string} Adjacent block's client ID, or null if none exists.
 */
export function getPreviousBlockClientId( state, startClientId ) {
	return getAdjacentBlockClientId( state, startClientId, -1 );
}

/**
 * Returns the next block's client ID from the given reference start ID.
 * Defaults start to the selected block. Returns null if there is no next
 * block.
 *
 * @param {Object}  state         Editor state.
 * @param {?string} startClientId Optional client ID of block from which to
 *                                search.
 *
 * @return {?string} Adjacent block's client ID, or null if none exists.
 */
export function getNextBlockClientId( state, startClientId ) {
	return getAdjacentBlockClientId( state, startClientId, 1 );
}

/**
 * Returns the initial caret position for the selected block.
 * This position is to used to position the caret properly when the selected block changes.
 *
 * @param {Object} state Global application state.
 *
 * @return {?Object} Selected block.
 */
export function getSelectedBlocksInitialCaretPosition( state ) {
	const { start, end } = state.blockSelection;
	if ( start !== end || ! start ) {
		return null;
	}

	return state.blockSelection.initialPosition;
}

/**
 * Returns the current selection set of block client IDs (multiselection or single selection).
 *
 * @param {Object} state Editor state.
 *
 * @return {Array} Multi-selected block client IDs.
 */
export const getSelectedBlockClientIds = createSelector(
	( state ) => {
		const { start, end } = state.blockSelection;
		if ( start === null || end === null ) {
			return EMPTY_ARRAY;
		}

		if ( start === end ) {
			return [ start ];
		}

		// Retrieve root client ID to aid in retrieving relevant nested block
		// order, being careful to allow the falsey empty string top-level root
		// by explicitly testing against null.
		const rootClientId = getBlockRootClientId( state, start );
		if ( rootClientId === null ) {
			return EMPTY_ARRAY;
		}

		const blockOrder = getBlockOrder( state, rootClientId );
		const startIndex = blockOrder.indexOf( start );
		const endIndex = blockOrder.indexOf( end );

		if ( startIndex > endIndex ) {
			return blockOrder.slice( endIndex, startIndex + 1 );
		}

		return blockOrder.slice( startIndex, endIndex + 1 );
	},
	( state ) => [
		state.blocks.order,
		state.blockSelection.start,
		state.blockSelection.end,
	],
);

/**
 * Returns the current multi-selection set of block client IDs, or an empty
 * array if there is no multi-selection.
 *
 * @param {Object} state Editor state.
 *
 * @return {Array} Multi-selected block client IDs.
 */
export function getMultiSelectedBlockClientIds( state ) {
	const { start, end } = state.blockSelection;
	if ( start === end ) {
		return EMPTY_ARRAY;
	}

	return getSelectedBlockClientIds( state );
}

/**
 * Returns the current multi-selection set of blocks, or an empty array if
 * there is no multi-selection.
 *
 * @param {Object} state Editor state.
 *
 * @return {Array} Multi-selected block objects.
 */
export const getMultiSelectedBlocks = createSelector(
	( state ) => {
		const multiSelectedBlockClientIds = getMultiSelectedBlockClientIds( state );
		if ( ! multiSelectedBlockClientIds.length ) {
			return EMPTY_ARRAY;
		}

		return multiSelectedBlockClientIds.map( ( clientId ) => getBlock( state, clientId ) );
	},
	( state ) => [
		...getSelectedBlockClientIds.getDependants( state ),
		state.blocks.byClientId,
		state.blocks.order,
		state.blocks.attributes,
		getPostMeta( state ),
	]
);

/**
 * Returns the client ID of the first block in the multi-selection set, or null
 * if there is no multi-selection.
 *
 * @param {Object} state Editor state.
 *
 * @return {?string} First block client ID in the multi-selection set.
 */
export function getFirstMultiSelectedBlockClientId( state ) {
	return first( getMultiSelectedBlockClientIds( state ) ) || null;
}

/**
 * Returns the client ID of the last block in the multi-selection set, or null
 * if there is no multi-selection.
 *
 * @param {Object} state Editor state.
 *
 * @return {?string} Last block client ID in the multi-selection set.
 */
export function getLastMultiSelectedBlockClientId( state ) {
	return last( getMultiSelectedBlockClientIds( state ) ) || null;
}

/**
 * Checks if possibleAncestorId is an ancestor of possibleDescendentId.
 *
 * @param {Object} state                Editor state.
 * @param {string} possibleAncestorId   Possible ancestor client ID.
 * @param {string} possibleDescendentId Possible descent client ID.
 *
 * @return {boolean} True if possibleAncestorId is an ancestor
 *                   of possibleDescendentId, and false otherwise.
 */
const isAncestorOf = createSelector(
	( state, possibleAncestorId, possibleDescendentId ) => {
		let idToCheck = possibleDescendentId;
		while ( possibleAncestorId !== idToCheck && idToCheck ) {
			idToCheck = getBlockRootClientId( state, idToCheck );
		}
		return possibleAncestorId === idToCheck;
	},
	( state ) => [
		state.blocks.order,
	],
);

/**
 * Returns true if a multi-selection exists, and the block corresponding to the
 * specified client ID is the first block of the multi-selection set, or false
 * otherwise.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {boolean} Whether block is first in multi-selection.
 */
export function isFirstMultiSelectedBlock( state, clientId ) {
	return getFirstMultiSelectedBlockClientId( state ) === clientId;
}

/**
 * Returns true if the client ID occurs within the block multi-selection, or
 * false otherwise.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {boolean} Whether block is in multi-selection set.
 */
export function isBlockMultiSelected( state, clientId ) {
	return getMultiSelectedBlockClientIds( state ).indexOf( clientId ) !== -1;
}

/**
 * Returns true if an ancestor of the block is multi-selected, or false
 * otherwise.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {boolean} Whether an ancestor of the block is in multi-selection
 *                   set.
 */
export const isAncestorMultiSelected = createSelector(
	( state, clientId ) => {
		let ancestorClientId = clientId;
		let isMultiSelected = false;
		while ( ancestorClientId && ! isMultiSelected ) {
			ancestorClientId = getBlockRootClientId( state, ancestorClientId );
			isMultiSelected = isBlockMultiSelected( state, ancestorClientId );
		}
		return isMultiSelected;
	},
	( state ) => [
		state.blocks.order,
		state.blockSelection.start,
		state.blockSelection.end,
	],
);
/**
 * Returns the client ID of the block which begins the multi-selection set, or
 * null if there is no multi-selection.
 *
 * This is not necessarily the first client ID in the selection.
 *
 * @see getFirstMultiSelectedBlockClientId
 *
 * @param {Object} state Editor state.
 *
 * @return {?string} Client ID of block beginning multi-selection.
 */
export function getMultiSelectedBlocksStartClientId( state ) {
	const { start, end } = state.blockSelection;
	if ( start === end ) {
		return null;
	}
	return start || null;
}

/**
 * Returns the client ID of the block which ends the multi-selection set, or
 * null if there is no multi-selection.
 *
 * This is not necessarily the last client ID in the selection.
 *
 * @see getLastMultiSelectedBlockClientId
 *
 * @param {Object} state Editor state.
 *
 * @return {?string} Client ID of block ending multi-selection.
 */
export function getMultiSelectedBlocksEndClientId( state ) {
	const { start, end } = state.blockSelection;
	if ( start === end ) {
		return null;
	}
	return end || null;
}

/**
 * Returns an array containing all block client IDs in the editor in the order
 * they appear. Optionally accepts a root client ID of the block list for which
 * the order should be returned, defaulting to the top-level block order.
 *
 * @param {Object}  state        Editor state.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {Array} Ordered client IDs of editor blocks.
 */
export function getBlockOrder( state, rootClientId ) {
	return state.blocks.order[ rootClientId || '' ] || EMPTY_ARRAY;
}

/**
 * Returns the index at which the block corresponding to the specified client
 * ID occurs within the block order, or `-1` if the block does not exist.
 *
 * @param {Object}  state        Editor state.
 * @param {string}  clientId     Block client ID.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {number} Index at which block exists in order.
 */
export function getBlockIndex( state, clientId, rootClientId ) {
	return getBlockOrder( state, rootClientId ).indexOf( clientId );
}

/**
 * Returns true if the block corresponding to the specified client ID is
 * currently selected and no multi-selection exists, or false otherwise.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {boolean} Whether block is selected and multi-selection exists.
 */
export function isBlockSelected( state, clientId ) {
	const { start, end } = state.blockSelection;

	if ( start !== end ) {
		return false;
	}

	return start === clientId;
}

/**
 * Returns true if one of the block's inner blocks is selected.
 *
 * @param {Object}  state    Editor state.
 * @param {string}  clientId Block client ID.
 * @param {boolean} deep     Perform a deep check.
 *
 * @return {boolean} Whether the block as an inner block selected
 */
export function hasSelectedInnerBlock( state, clientId, deep = false ) {
	return some(
		getBlockOrder( state, clientId ),
		( innerClientId ) => (
			isBlockSelected( state, innerClientId ) ||
			isBlockMultiSelected( state, innerClientId ) ||
			( deep && hasSelectedInnerBlock( state, innerClientId, deep ) )
		)
	);
}

/**
 * Returns true if the block corresponding to the specified client ID is
 * currently selected but isn't the last of the selected blocks. Here "last"
 * refers to the block sequence in the document, _not_ the sequence of
 * multi-selection, which is why `state.blockSelection.end` isn't used.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {boolean} Whether block is selected and not the last in the
 *                   selection.
 */
export function isBlockWithinSelection( state, clientId ) {
	if ( ! clientId ) {
		return false;
	}

	const clientIds = getMultiSelectedBlockClientIds( state );
	const index = clientIds.indexOf( clientId );
	return index > -1 && index < clientIds.length - 1;
}

/**
 * Returns true if a multi-selection has been made, or false otherwise.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Whether multi-selection has been made.
 */
export function hasMultiSelection( state ) {
	const { start, end } = state.blockSelection;
	return start !== end;
}

/**
 * Whether in the process of multi-selecting or not. This flag is only true
 * while the multi-selection is being selected (by mouse move), and is false
 * once the multi-selection has been settled.
 *
 * @see hasMultiSelection
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} True if multi-selecting, false if not.
 */
export function isMultiSelecting( state ) {
	return state.blockSelection.isMultiSelecting;
}

/**
 * Selector that returns if multi-selection is enabled or not.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} True if it should be possible to multi-select blocks, false if multi-selection is disabled.
 */
export function isSelectionEnabled( state ) {
	return state.blockSelection.isEnabled;
}

/**
 * Returns the block's editing mode, defaulting to "visual" if not explicitly
 * assigned.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {Object} Block editing mode.
 */
export function getBlockMode( state, clientId ) {
	return state.blocksMode[ clientId ] || 'visual';
}

/**
 * Returns true if the user is typing, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether user is typing.
 */
export function isTyping( state ) {
	return state.isTyping;
}

/**
 * Returns true if the caret is within formatted text, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the caret is within formatted text.
 */
export function isCaretWithinFormattedText( state ) {
	return state.isCaretWithinFormattedText;
}

/**
 * Returns the insertion point, the index at which the new inserted block would
 * be placed. Defaults to the last index.
 *
 * @param {Object} state Editor state.
 *
 * @return {Object} Insertion point object with `rootClientId`, `index`.
 */
export function getBlockInsertionPoint( state ) {
	let rootClientId, index;

	const { insertionPoint, blockSelection } = state;
	if ( insertionPoint !== null ) {
		return insertionPoint;
	}

	const { end } = blockSelection;
	if ( end ) {
		rootClientId = getBlockRootClientId( state, end ) || undefined;
		index = getBlockIndex( state, end, rootClientId ) + 1;
	} else {
		index = getBlockOrder( state ).length;
	}

	return { rootClientId, index };
}

/**
 * Returns true if we should show the block insertion point.
 *
 * @param {Object} state Global application state.
 *
 * @return {?boolean} Whether the insertion point is visible or not.
 */
export function isBlockInsertionPointVisible( state ) {
	return state.insertionPoint !== null;
}

/**
 * Returns whether the blocks matches the template or not.
 *
 * @param {boolean} state
 * @return {?boolean} Whether the template is valid or not.
 */
export function isValidTemplate( state ) {
	return state.template.isValid;
}

/**
 * Returns the defined block template
 *
 * @param {boolean} state
 * @return {?Array}        Block Template
 */
export function getTemplate( state ) {
	return state.settings.template;
}

/**
 * Returns the defined block template lock. Optionally accepts a root block
 * client ID as context, otherwise defaulting to the global context.
 *
 * @param {Object}  state        Editor state.
 * @param {?string} rootClientId Optional block root client ID.
 *
 * @return {?string} Block Template Lock
 */
export function getTemplateLock( state, rootClientId ) {
	if ( ! rootClientId ) {
		return state.settings.templateLock;
	}

	const blockListSettings = getBlockListSettings( state, rootClientId );
	if ( ! blockListSettings ) {
		return null;
	}

	return blockListSettings.templateLock;
}

/**
 * Determines if the given block type is allowed to be inserted into the block list.
 * This function is not exported and not memoized because using a memoized selector
 * inside another memoized selector is just a waste of time.
 *
 * @param {Object}  state        Editor state.
 * @param {string}  blockName    The name of the block type, e.g.' core/paragraph'.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {boolean} Whether the given block type is allowed to be inserted.
 */
const canInsertBlockTypeUnmemoized = ( state, blockName, rootClientId = null ) => {
	const checkAllowList = ( list, item, defaultResult = null ) => {
		if ( isBoolean( list ) ) {
			return list;
		}
		if ( isArray( list ) ) {
			return includes( list, item );
		}
		return defaultResult;
	};

	const blockType = getBlockType( blockName );
	if ( ! blockType ) {
		return false;
	}

	const { allowedBlockTypes } = getSettings( state );

	const isBlockAllowedInEditor = checkAllowList( allowedBlockTypes, blockName, true );
	if ( ! isBlockAllowedInEditor ) {
		return false;
	}

	const isLocked = !! getTemplateLock( state, rootClientId );
	if ( isLocked ) {
		return false;
	}

	const parentBlockListSettings = getBlockListSettings( state, rootClientId );
	const parentAllowedBlocks = get( parentBlockListSettings, [ 'allowedBlocks' ] );
	const hasParentAllowedBlock = checkAllowList( parentAllowedBlocks, blockName );

	const blockAllowedParentBlocks = blockType.parent;
	const parentName = getBlockName( state, rootClientId );
	const hasBlockAllowedParent = checkAllowList( blockAllowedParentBlocks, parentName );

	if ( hasParentAllowedBlock !== null && hasBlockAllowedParent !== null ) {
		return hasParentAllowedBlock || hasBlockAllowedParent;
	} else if ( hasParentAllowedBlock !== null ) {
		return hasParentAllowedBlock;
	} else if ( hasBlockAllowedParent !== null ) {
		return hasBlockAllowedParent;
	}

	return true;
};

/**
 * Determines if the given block type is allowed to be inserted into the block list.
 *
 * @param {Object}  state        Editor state.
 * @param {string}  blockName    The name of the block type, e.g.' core/paragraph'.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {boolean} Whether the given block type is allowed to be inserted.
 */
export const canInsertBlockType = createSelector(
	canInsertBlockTypeUnmemoized,
	( state, blockName, rootClientId ) => [
		state.blockListSettings[ rootClientId ],
		state.blocks.byClientId[ rootClientId ],
		state.settings.allowedBlockTypes,
		state.settings.templateLock,
	],
);

/**
 * Returns information about how recently and frequently a block has been inserted.
 *
 * @param {Object} state Global application state.
 * @param {string} id    A string which identifies the insert, e.g. 'core/block/12'
 *
 * @return {?{ time: number, count: number }} An object containing `time` which is when the last
 *                                            insert occurred as a UNIX epoch, and `count` which is
 *                                            the number of inserts that have occurred.
 */
function getInsertUsage( state, id ) {
	return get( state.preferences.insertUsage, [ id ], null );
}

/**
 * Returns whether we can show a block type in the inserter
 *
 * @param {Object} state Global State
 * @param {Object} blockType BlockType
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {boolean} Whether the given block type is allowed to be shown in the inserter.
 */
const canIncludeBlockTypeInInserter = ( state, blockType, rootClientId ) => {
	if ( ! hasBlockSupport( blockType, 'inserter', true ) ) {
		return false;
	}

	return canInsertBlockTypeUnmemoized( state, blockType.name, rootClientId );
};

/**
 * Returns whether we can show a reusable block in the inserter
 *
 * @param {Object} state Global State
 * @param {Object} reusableBlock Reusable block object
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {boolean} Whether the given block type is allowed to be shown in the inserter.
 */
const canIncludeReusableBlockInInserter = ( state, reusableBlock, rootClientId ) => {
	if ( ! canInsertBlockTypeUnmemoized( state, 'core/block', rootClientId ) ) {
		return false;
	}

	const referencedBlockName = getBlockName( state, reusableBlock.clientId );
	if ( ! referencedBlockName ) {
		return false;
	}

	const referencedBlockType = getBlockType( referencedBlockName );
	if ( ! referencedBlockType ) {
		return false;
	}

	if ( ! canInsertBlockTypeUnmemoized( state, referencedBlockName, rootClientId ) ) {
		return false;
	}

	if ( isAncestorOf( state, reusableBlock.clientId, rootClientId ) ) {
		return false;
	}

	return true;
};

/**
 * Determines the items that appear in the inserter. Includes both static
 * items (e.g. a regular block type) and dynamic items (e.g. a reusable block).
 *
 * Each item object contains what's necessary to display a button in the
 * inserter and handle its selection.
 *
 * The 'utility' property indicates how useful we think an item will be to the
 * user. There are 4 levels of utility:
 *
 * 1. Blocks that are contextually useful (utility = 3)
 * 2. Blocks that have been previously inserted (utility = 2)
 * 3. Blocks that are in the common category (utility = 1)
 * 4. All other blocks (utility = 0)
 *
 * The 'frecency' property is a heuristic (https://en.wikipedia.org/wiki/Frecency)
 * that combines block usage frequenty and recency.
 *
 * Items are returned ordered descendingly by their 'utility' and 'frecency'.
 *
 * @param {Object}  state        Editor state.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {Editor.InserterItem[]} Items that appear in inserter.
 *
 * @typedef {Object} Editor.InserterItem
 * @property {string}   id                Unique identifier for the item.
 * @property {string}   name              The type of block to create.
 * @property {Object}   initialAttributes Attributes to pass to the newly created block.
 * @property {string}   title             Title of the item, as it appears in the inserter.
 * @property {string}   icon              Dashicon for the item, as it appears in the inserter.
 * @property {string}   category          Block category that the item is associated with.
 * @property {string[]} keywords          Keywords that can be searched to find this item.
 * @property {boolean}  isDisabled        Whether or not the user should be prevented from inserting
 *                                        this item.
 * @property {number}   utility           How useful we think this item is, between 0 and 3.
 * @property {number}   frecency          Hueristic that combines frequency and recency.
 */
export const getInserterItems = createSelector(
	( state, rootClientId = null ) => {
		const calculateUtility = ( category, count, isContextual ) => {
			if ( isContextual ) {
				return INSERTER_UTILITY_HIGH;
			} else if ( count > 0 ) {
				return INSERTER_UTILITY_MEDIUM;
			} else if ( category === 'common' ) {
				return INSERTER_UTILITY_LOW;
			}
			return INSERTER_UTILITY_NONE;
		};

		const calculateFrecency = ( time, count ) => {
			if ( ! time ) {
				return count;
			}

			// The selector is cached, which means Date.now() is the last time that the
			// relevant state changed. This suits our needs.
			const duration = Date.now() - time;

			switch ( true ) {
				case duration < MILLISECONDS_PER_HOUR:
					return count * 4;
				case duration < MILLISECONDS_PER_DAY:
					return count * 2;
				case duration < MILLISECONDS_PER_WEEK:
					return count / 2;
				default:
					return count / 4;
			}
		};

		const buildBlockTypeInserterItem = ( blockType ) => {
			const id = blockType.name;

			let isDisabled = false;
			if ( ! hasBlockSupport( blockType.name, 'multiple', true ) ) {
				isDisabled = some( getBlocksByClientId( state, getClientIdsWithDescendants( state ) ), { name: blockType.name } );
			}

			const isContextual = isArray( blockType.parent );
			const { time, count = 0 } = getInsertUsage( state, id ) || {};

			return {
				id,
				name: blockType.name,
				initialAttributes: {},
				title: blockType.title,
				icon: blockType.icon,
				category: blockType.category,
				keywords: blockType.keywords,
				isDisabled,
				utility: calculateUtility( blockType.category, count, isContextual ),
				frecency: calculateFrecency( time, count ),
				hasChildBlocksWithInserterSupport: hasChildBlocksWithInserterSupport( blockType.name ),
			};
		};

		const buildReusableBlockInserterItem = ( reusableBlock ) => {
			const id = `core/block/${ reusableBlock.id }`;

			const referencedBlockName = getBlockName( state, reusableBlock.clientId );
			const referencedBlockType = getBlockType( referencedBlockName );

			const { time, count = 0 } = getInsertUsage( state, id ) || {};
			const utility = calculateUtility( 'reusable', count, false );
			const frecency = calculateFrecency( time, count );

			return {
				id,
				name: 'core/block',
				initialAttributes: { ref: reusableBlock.id },
				title: reusableBlock.title,
				icon: referencedBlockType.icon,
				category: 'reusable',
				keywords: [],
				isDisabled: false,
				utility,
				frecency,
			};
		};

		const blockTypeInserterItems = getBlockTypes()
			.filter( ( blockType ) => canIncludeBlockTypeInInserter( state, blockType, rootClientId ) )
			.map( buildBlockTypeInserterItem );

		const reusableBlockInserterItems = getReusableBlocks( state )
			.filter( ( block ) => canIncludeReusableBlockInInserter( state, block, rootClientId ) )
			.map( buildReusableBlockInserterItem );

		return orderBy(
			[ ...blockTypeInserterItems, ...reusableBlockInserterItems ],
			[ 'utility', 'frecency' ],
			[ 'desc', 'desc' ]
		);
	},
	( state, rootClientId ) => [
		state.blockListSettings[ rootClientId ],
		state.blocks.byClientId,
		state.blocks.order,
		state.preferences.insertUsage,
		state.settings.allowedBlockTypes,
		state.settings.templateLock,
		getReusableBlocks( state ),
		getBlockTypes(),
	],
);

/**
 * Determines whether there are items to show in the inserter.
 * @param {Object}  state        Editor state.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {boolean} Items that appear in inserter.
 */
export const hasInserterItems = createSelector(
	( state, rootClientId = null ) => {
		const hasBlockType = some(
			getBlockTypes(),
			( blockType ) => canIncludeBlockTypeInInserter( state, blockType, rootClientId )
		);
		if ( hasBlockType ) {
			return true;
		}
		const hasReusableBlock = some(
			getReusableBlocks( state ),
			( block ) => canIncludeReusableBlockInInserter( state, block, rootClientId )
		);

		return hasReusableBlock;
	},
	( state, rootClientId ) => [
		state.blockListSettings[ rootClientId ],
		state.blocks.byClientId,
		state.settings.allowedBlockTypes,
		state.settings.templateLock,
		getReusableBlocks( state ),
		getBlockTypes(),
	],
);

/**
 * Returns the Block List settings of a block, if any exist.
 *
 * @param {Object}  state    Editor state.
 * @param {?string} clientId Block client ID.
 *
 * @return {?Object} Block settings of the block if set.
 */
export function getBlockListSettings( state, clientId ) {
	return state.blockListSettings[ clientId ];
}

/**
 * Returns the editor settings.
 *
 * @param {Object} state Editor state.
 *
 * @return {Object} The editor settings object.
 */
export function getSettings( state ) {
	return state.settings;
}

/**
 * Returns true if the most recent block change is be considered persistent, or
 * false otherwise. A persistent change is one committed by BlockEditorProvider
 * via its `onChange` callback, in addition to `onInput`.
 *
 * @param {Object} state Block editor state.
 *
 * @return {boolean} Whether the most recent block change was persistent.
 */
export function isLastBlockChangePersistent( state ) {
	return state.blocks.isPersistentChange;
}

/**
 * Returns the value of a post meta from the editor settings.
 *
 * @param {Object} state Global application state.
 * @param {string} key   Meta Key to retrieve
 *
 * @return {*} Meta value
 */
function getPostMeta( state, key ) {
	if ( key === undefined ) {
		return get( state, [ 'settings', '__experimentalMetaSource', 'value' ], EMPTY_OBJECT );
	}

	return get( state, [ 'settings', '__experimentalMetaSource', 'value', key ] );
}

/**
 * Returns the available reusable blocks
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} Reusable blocks
 */
function getReusableBlocks( state ) {
	return get( state, [ 'settings', '__experimentalReusableBlocks' ], EMPTY_ARRAY );
}
