/**
 * WordPress dependencies
 */
import {
	getBlockType,
	getBlockTypes,
	getBlockVariations,
	hasBlockSupport,
	getPossibleBlockTransformations,
	switchToBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import { Platform } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { symbol } from '@wordpress/icons';
import { create, remove, toHTMLString } from '@wordpress/rich-text';
import deprecated from '@wordpress/deprecated';
import { createSelector, createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	isFiltered,
	checkAllowListRecursive,
	checkAllowList,
	getAllPatternsDependants,
	getInsertBlockTypeDependants,
	getParsedPattern,
	getGrammar,
} from './utils';
import { orderBy } from '../utils/sorting';
import { STORE_NAME } from './constants';
import { unlock } from '../lock-unlock';

import {
	getContentLockingParent,
	getTemporarilyEditingAsBlocks,
	getTemporarilyEditingFocusModeToRevert,
	getSectionRootClientId,
	isSectionBlock,
	getParentSectionBlock,
} from './private-selectors';

/**
 * A block selection object.
 *
 * @typedef {Object} WPBlockSelection
 *
 * @property {string} clientId     A block client ID.
 * @property {string} attributeKey A block attribute key.
 * @property {number} offset       An attribute value offset, based on the rich
 *                                 text value. See `wp.richText.create`.
 */

// Module constants.
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
 * Shared reference to an empty Set for cases where it is important to avoid
 * returning a new Set reference on every invocation, as in a connected or
 * other pure component which performs `shouldComponentUpdate` check on props.
 * This should be used as a last resort, since the normalized data should be
 * maintained by the reducer result in state.
 *
 * @type {Set}
 */
const EMPTY_SET = new Set();

const DEFAULT_INSERTER_OPTIONS = {
	[ isFiltered ]: true,
};

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
	const block = state.blocks.byClientId.get( clientId );
	const socialLinkName = 'core/social-link';

	if ( Platform.OS !== 'web' && block?.name === socialLinkName ) {
		const attributes = state.blocks.attributes.get( clientId );
		const { service } = attributes ?? {};

		return service ? `${ socialLinkName }-${ service }` : socialLinkName;
	}
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
	const block = state.blocks.byClientId.get( clientId );
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
export function getBlockAttributes( state, clientId ) {
	const block = state.blocks.byClientId.get( clientId );
	if ( ! block ) {
		return null;
	}

	return state.blocks.attributes.get( clientId );
}

/**
 * Returns a block given its client ID. This is a parsed copy of the block,
 * containing its `blockName`, `clientId`, and current `attributes` state. This
 * is not the block's registration settings, which must be retrieved from the
 * blocks module registration store.
 *
 * getBlock recurses through its inner blocks until all its children blocks have
 * been retrieved. Note that getBlock will not return the child inner blocks of
 * an inner block controller. This is because an inner block controller syncs
 * itself with its own entity, and should therefore not be included with the
 * blocks of a different entity. For example, say you call `getBlocks( TP )` to
 * get the blocks of a template part. If another template part is a child of TP,
 * then the nested template part's child blocks will not be returned. This way,
 * the template block itself is considered part of the parent, but the children
 * are not.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {Object} Parsed block object.
 */
export function getBlock( state, clientId ) {
	if ( ! state.blocks.byClientId.has( clientId ) ) {
		return null;
	}

	return state.blocks.tree.get( clientId );
}

export const __unstableGetBlockWithoutInnerBlocks = createSelector(
	( state, clientId ) => {
		const block = state.blocks.byClientId.get( clientId );
		if ( ! block ) {
			return null;
		}

		return {
			...block,
			attributes: getBlockAttributes( state, clientId ),
		};
	},
	( state, clientId ) => [
		state.blocks.byClientId.get( clientId ),
		state.blocks.attributes.get( clientId ),
	]
);

/**
 * Returns all block objects for the current post being edited as an array in
 * the order they appear in the post. Note that this will exclude child blocks
 * of nested inner block controllers.
 *
 * @param {Object}  state        Editor state.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {Object[]} Post blocks.
 */
export function getBlocks( state, rootClientId ) {
	const treeKey =
		! rootClientId || ! areInnerBlocksControlled( state, rootClientId )
			? rootClientId || ''
			: 'controlled||' + rootClientId;
	return state.blocks.tree.get( treeKey )?.innerBlocks || EMPTY_ARRAY;
}

/**
 * Returns a stripped down block object containing only its client ID,
 * and its inner blocks' client IDs.
 *
 * @deprecated
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Client ID of the block to get.
 *
 * @return {Object} Client IDs of the post blocks.
 */
export const __unstableGetClientIdWithClientIdsTree = createSelector(
	( state, clientId ) => {
		deprecated(
			"wp.data.select( 'core/block-editor' ).__unstableGetClientIdWithClientIdsTree",
			{
				since: '6.3',
				version: '6.5',
			}
		);
		return {
			clientId,
			innerBlocks: __unstableGetClientIdsTree( state, clientId ),
		};
	},
	( state ) => [ state.blocks.order ]
);

/**
 * Returns the block tree represented in the block-editor store from the
 * given root, consisting of stripped down block objects containing only
 * their client IDs, and their inner blocks' client IDs.
 *
 * @deprecated
 *
 * @param {Object}  state        Editor state.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {Object[]} Client IDs of the post blocks.
 */
export const __unstableGetClientIdsTree = createSelector(
	( state, rootClientId = '' ) => {
		deprecated(
			"wp.data.select( 'core/block-editor' ).__unstableGetClientIdsTree",
			{
				since: '6.3',
				version: '6.5',
			}
		);
		return getBlockOrder( state, rootClientId ).map( ( clientId ) =>
			__unstableGetClientIdWithClientIdsTree( state, clientId )
		);
	},
	( state ) => [ state.blocks.order ]
);

/**
 * Returns an array containing the clientIds of all descendants of the blocks
 * given. Returned ids are ordered first by the order of the ids given, then
 * by the order that they appear in the editor.
 *
 * @param {Object}          state   Global application state.
 * @param {string|string[]} rootIds Client ID(s) for which descendant blocks are to be returned.
 *
 * @return {Array} Client IDs of descendants.
 */
export const getClientIdsOfDescendants = createSelector(
	( state, rootIds ) => {
		rootIds = Array.isArray( rootIds ) ? [ ...rootIds ] : [ rootIds ];
		const ids = [];

		// Add the descendants of the root blocks first.
		for ( const rootId of rootIds ) {
			const order = state.blocks.order.get( rootId );
			if ( order ) {
				ids.push( ...order );
			}
		}

		let index = 0;

		// Add the descendants of the descendants, recursively.
		while ( index < ids.length ) {
			const id = ids[ index ];
			const order = state.blocks.order.get( id );
			if ( order ) {
				ids.splice( index + 1, 0, ...order );
			}
			index++;
		}

		return ids;
	},
	( state ) => [ state.blocks.order ]
);

/**
 * Returns an array containing the clientIds of the top-level blocks and
 * their descendants of any depth (for nested blocks). Ids are returned
 * in the same order that they appear in the editor.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} ids of top-level and descendant blocks.
 */
export const getClientIdsWithDescendants = ( state ) =>
	getClientIdsOfDescendants( state, '' );

/**
 * Returns the total number of blocks, or the total number of blocks with a specific name in a post.
 * The number returned includes nested blocks.
 *
 * @param {Object}  state     Global application state.
 * @param {?string} blockName Optional block name, if specified only blocks of that type will be counted.
 *
 * @return {number} Number of blocks in the post, or number of blocks with name equal to blockName.
 */
export const getGlobalBlockCount = createSelector(
	( state, blockName ) => {
		const clientIds = getClientIdsWithDescendants( state );
		if ( ! blockName ) {
			return clientIds.length;
		}
		let count = 0;
		for ( const clientId of clientIds ) {
			const block = state.blocks.byClientId.get( clientId );
			if ( block.name === blockName ) {
				count++;
			}
		}
		return count;
	},
	( state ) => [ state.blocks.order, state.blocks.byClientId ]
);

/**
 * Returns all blocks that match a blockName. Results include nested blocks.
 *
 * @param {Object}   state     Global application state.
 * @param {string[]} blockName Block name(s) for which clientIds are to be returned.
 *
 * @return {Array} Array of clientIds of blocks with name equal to blockName.
 */
export const getBlocksByName = createSelector(
	( state, blockName ) => {
		if ( ! blockName ) {
			return EMPTY_ARRAY;
		}
		const blockNames = Array.isArray( blockName )
			? blockName
			: [ blockName ];
		const clientIds = getClientIdsWithDescendants( state );
		const foundBlocks = clientIds.filter( ( clientId ) => {
			const block = state.blocks.byClientId.get( clientId );
			return blockNames.includes( block.name );
		} );
		return foundBlocks.length > 0 ? foundBlocks : EMPTY_ARRAY;
	},
	( state ) => [ state.blocks.order, state.blocks.byClientId ]
);

/**
 * Returns all global blocks that match a blockName. Results include nested blocks.
 *
 * @deprecated
 *
 * @param {Object}   state     Global application state.
 * @param {string[]} blockName Block name(s) for which clientIds are to be returned.
 *
 * @return {Array} Array of clientIds of blocks with name equal to blockName.
 */
export function __experimentalGetGlobalBlocksByName( state, blockName ) {
	deprecated(
		"wp.data.select( 'core/block-editor' ).__experimentalGetGlobalBlocksByName",
		{
			since: '6.5',
			alternative: `wp.data.select( 'core/block-editor' ).getBlocksByName`,
		}
	);
	return getBlocksByName( state, blockName );
}

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
	( state, clientIds ) =>
		( Array.isArray( clientIds ) ? clientIds : [ clientIds ] ).map(
			( clientId ) => getBlock( state, clientId )
		),
	( state, clientIds ) =>
		( Array.isArray( clientIds ) ? clientIds : [ clientIds ] ).map(
			( clientId ) => state.blocks.tree.get( clientId )
		)
);

/**
 * Given an array of block client IDs, returns the corresponding array of block
 * names.
 *
 * @param {Object}   state     Editor state.
 * @param {string[]} clientIds Client IDs for which block names are to be returned.
 *
 * @return {string[]} Block names.
 */
export const getBlockNamesByClientId = createSelector(
	( state, clientIds ) =>
		getBlocksByClientId( state, clientIds )
			.filter( Boolean )
			.map( ( block ) => block.name ),
	( state, clientIds ) => getBlocksByClientId( state, clientIds )
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
 * Returns the current selection start block client ID, attribute key and text
 * offset.
 *
 * @param {Object} state Block editor state.
 *
 * @return {WPBlockSelection} Selection start information.
 */
export function getSelectionStart( state ) {
	return state.selection.selectionStart;
}

/**
 * Returns the current selection end block client ID, attribute key and text
 * offset.
 *
 * @param {Object} state Block editor state.
 *
 * @return {WPBlockSelection} Selection end information.
 */
export function getSelectionEnd( state ) {
	return state.selection.selectionEnd;
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
	return state.selection.selectionStart.clientId;
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
	return state.selection.selectionEnd.clientId;
}

/**
 * Returns the number of blocks currently selected in the post.
 *
 * @param {Object} state Global application state.
 *
 * @return {number} Number of blocks selected in the post.
 */
export function getSelectedBlockCount( state ) {
	const multiSelectedBlockCount =
		getMultiSelectedBlockClientIds( state ).length;

	if ( multiSelectedBlockCount ) {
		return multiSelectedBlockCount;
	}

	return state.selection.selectionStart.clientId ? 1 : 0;
}

/**
 * Returns true if there is a single selected block, or false otherwise.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Whether a single block is selected.
 */
export function hasSelectedBlock( state ) {
	const { selectionStart, selectionEnd } = state.selection;
	return (
		!! selectionStart.clientId &&
		selectionStart.clientId === selectionEnd.clientId
	);
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
	const { selectionStart, selectionEnd } = state.selection;
	const { clientId } = selectionStart;

	if ( ! clientId || clientId !== selectionEnd.clientId ) {
		return null;
	}

	return clientId;
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
export function getBlockRootClientId( state, clientId ) {
	return state.blocks.parents.get( clientId ) ?? null;
}

/**
 * Given a block client ID, returns the list of all its parents from top to bottom.
 *
 * @param {Object}  state     Editor state.
 * @param {string}  clientId  Block from which to find root client ID.
 * @param {boolean} ascending Order results from bottom to top (true) or top to bottom (false).
 *
 * @return {Array} ClientIDs of the parent blocks.
 */
export const getBlockParents = createSelector(
	( state, clientId, ascending = false ) => {
		const parents = [];
		let current = clientId;
		while ( ( current = state.blocks.parents.get( current ) ) ) {
			parents.push( current );
		}

		if ( ! parents.length ) {
			return EMPTY_ARRAY;
		}

		return ascending ? parents : parents.reverse();
	},
	( state ) => [ state.blocks.parents ]
);

/**
 * Given a block client ID and a block name, returns the list of all its parents
 * from top to bottom, filtered by the given name(s). For example, if passed
 * 'core/group' as the blockName, it will only return parents which are group
 * blocks. If passed `[ 'core/group', 'core/cover']`, as the blockName, it will
 * return parents which are group blocks and parents which are cover blocks.
 *
 * @param {Object}          state     Editor state.
 * @param {string}          clientId  Block from which to find root client ID.
 * @param {string|string[]} blockName Block name(s) to filter.
 * @param {boolean}         ascending Order results from bottom to top (true) or top to bottom (false).
 *
 * @return {Array} ClientIDs of the parent blocks.
 */
export const getBlockParentsByBlockName = createSelector(
	( state, clientId, blockName, ascending = false ) => {
		const parents = getBlockParents( state, clientId, ascending );
		const hasName = Array.isArray( blockName )
			? ( name ) => blockName.includes( name )
			: ( name ) => blockName === name;
		return parents.filter( ( id ) => hasName( getBlockName( state, id ) ) );
	},
	( state ) => [ state.blocks.parents ]
);
/**
 * Given a block client ID, returns the root of the hierarchy from which the block is nested, return the block itself for root level blocks.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block from which to find root client ID.
 *
 * @return {string} Root client ID
 */
export function getBlockHierarchyRootClientId( state, clientId ) {
	let current = clientId;
	let parent;
	do {
		parent = current;
		current = state.blocks.parents.get( current );
	} while ( current );
	return parent;
}

/**
 * Given a block client ID, returns the lowest common ancestor with selected client ID.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block from which to find common ancestor client ID.
 *
 * @return {string} Common ancestor client ID or undefined
 */
export function getLowestCommonAncestorWithSelectedBlock( state, clientId ) {
	const selectedId = getSelectedBlockClientId( state );
	const clientParents = [ ...getBlockParents( state, clientId ), clientId ];
	const selectedParents = [
		...getBlockParents( state, selectedId ),
		selectedId,
	];

	let lowestCommonAncestor;

	const maxDepth = Math.min( clientParents.length, selectedParents.length );
	for ( let index = 0; index < maxDepth; index++ ) {
		if ( clientParents[ index ] === selectedParents[ index ] ) {
			lowestCommonAncestor = clientParents[ index ];
		} else {
			break;
		}
	}

	return lowestCommonAncestor;
}

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
	const orderSet = order.get( rootClientId );
	const index = orderSet.indexOf( startClientId );
	const nextIndex = index + 1 * modifier;

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

/* eslint-disable jsdoc/valid-types */
/**
 * Returns the initial caret position for the selected block.
 * This position is to used to position the caret properly when the selected block changes.
 * If the current block is not a RichText, having initial position set to 0 means "focus block"
 *
 * @param {Object} state Global application state.
 *
 * @return {0|-1|null} Initial position.
 */
export function getSelectedBlocksInitialCaretPosition( state ) {
	/* eslint-enable jsdoc/valid-types */
	return state.initialPosition;
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
		const { selectionStart, selectionEnd } = state.selection;

		if ( ! selectionStart.clientId || ! selectionEnd.clientId ) {
			return EMPTY_ARRAY;
		}

		if ( selectionStart.clientId === selectionEnd.clientId ) {
			return [ selectionStart.clientId ];
		}

		// Retrieve root client ID to aid in retrieving relevant nested block
		// order, being careful to allow the falsey empty string top-level root
		// by explicitly testing against null.
		const rootClientId = getBlockRootClientId(
			state,
			selectionStart.clientId
		);

		if ( rootClientId === null ) {
			return EMPTY_ARRAY;
		}

		const blockOrder = getBlockOrder( state, rootClientId );
		const startIndex = blockOrder.indexOf( selectionStart.clientId );
		const endIndex = blockOrder.indexOf( selectionEnd.clientId );

		if ( startIndex > endIndex ) {
			return blockOrder.slice( endIndex, startIndex + 1 );
		}

		return blockOrder.slice( startIndex, endIndex + 1 );
	},
	( state ) => [
		state.blocks.order,
		state.selection.selectionStart.clientId,
		state.selection.selectionEnd.clientId,
	]
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
	const { selectionStart, selectionEnd } = state.selection;

	if ( selectionStart.clientId === selectionEnd.clientId ) {
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
		const multiSelectedBlockClientIds =
			getMultiSelectedBlockClientIds( state );
		if ( ! multiSelectedBlockClientIds.length ) {
			return EMPTY_ARRAY;
		}

		return multiSelectedBlockClientIds.map( ( clientId ) =>
			getBlock( state, clientId )
		);
	},
	( state ) => [
		...getSelectedBlockClientIds.getDependants( state ),
		state.blocks.byClientId,
		state.blocks.order,
		state.blocks.attributes,
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
	return getMultiSelectedBlockClientIds( state )[ 0 ] || null;
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
	const selectedClientIds = getMultiSelectedBlockClientIds( state );
	return selectedClientIds[ selectedClientIds.length - 1 ] || null;
}

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
		state.selection.selectionStart.clientId,
		state.selection.selectionEnd.clientId,
	]
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
	const { selectionStart, selectionEnd } = state.selection;

	if ( selectionStart.clientId === selectionEnd.clientId ) {
		return null;
	}

	return selectionStart.clientId || null;
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
	const { selectionStart, selectionEnd } = state.selection;

	if ( selectionStart.clientId === selectionEnd.clientId ) {
		return null;
	}

	return selectionEnd.clientId || null;
}

/**
 * Returns true if the selection is not partial.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Whether the selection is mergeable.
 */
export function __unstableIsFullySelected( state ) {
	const selectionAnchor = getSelectionStart( state );
	const selectionFocus = getSelectionEnd( state );
	return (
		! selectionAnchor.attributeKey &&
		! selectionFocus.attributeKey &&
		typeof selectionAnchor.offset === 'undefined' &&
		typeof selectionFocus.offset === 'undefined'
	);
}

/**
 * Returns true if the selection is collapsed.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Whether the selection is collapsed.
 */
export function __unstableIsSelectionCollapsed( state ) {
	const selectionAnchor = getSelectionStart( state );
	const selectionFocus = getSelectionEnd( state );
	return (
		!! selectionAnchor &&
		!! selectionFocus &&
		selectionAnchor.clientId === selectionFocus.clientId &&
		selectionAnchor.attributeKey === selectionFocus.attributeKey &&
		selectionAnchor.offset === selectionFocus.offset
	);
}

export function __unstableSelectionHasUnmergeableBlock( state ) {
	return getSelectedBlockClientIds( state ).some( ( clientId ) => {
		const blockName = getBlockName( state, clientId );
		const blockType = getBlockType( blockName );
		return ! blockType.merge;
	} );
}

/**
 * Check whether the selection is mergeable.
 *
 * @param {Object}  state     Editor state.
 * @param {boolean} isForward Whether to merge forwards.
 *
 * @return {boolean} Whether the selection is mergeable.
 */
export function __unstableIsSelectionMergeable( state, isForward ) {
	const selectionAnchor = getSelectionStart( state );
	const selectionFocus = getSelectionEnd( state );

	// It's not mergeable if the start and end are within the same block.
	if ( selectionAnchor.clientId === selectionFocus.clientId ) {
		return false;
	}

	// It's not mergeable if there's no rich text selection.
	if (
		! selectionAnchor.attributeKey ||
		! selectionFocus.attributeKey ||
		typeof selectionAnchor.offset === 'undefined' ||
		typeof selectionFocus.offset === 'undefined'
	) {
		return false;
	}

	const anchorRootClientId = getBlockRootClientId(
		state,
		selectionAnchor.clientId
	);
	const focusRootClientId = getBlockRootClientId(
		state,
		selectionFocus.clientId
	);

	// It's not mergeable if the selection doesn't start and end in the same
	// block list. Maybe in the future it should be allowed.
	if ( anchorRootClientId !== focusRootClientId ) {
		return false;
	}

	const blockOrder = getBlockOrder( state, anchorRootClientId );
	const anchorIndex = blockOrder.indexOf( selectionAnchor.clientId );
	const focusIndex = blockOrder.indexOf( selectionFocus.clientId );

	// Reassign selection start and end based on order.
	let selectionStart, selectionEnd;

	if ( anchorIndex > focusIndex ) {
		selectionStart = selectionFocus;
		selectionEnd = selectionAnchor;
	} else {
		selectionStart = selectionAnchor;
		selectionEnd = selectionFocus;
	}

	const targetBlockClientId = isForward
		? selectionEnd.clientId
		: selectionStart.clientId;
	const blockToMergeClientId = isForward
		? selectionStart.clientId
		: selectionEnd.clientId;

	const targetBlockName = getBlockName( state, targetBlockClientId );
	const targetBlockType = getBlockType( targetBlockName );

	if ( ! targetBlockType.merge ) {
		return false;
	}

	const blockToMerge = getBlock( state, blockToMergeClientId );

	// It's mergeable if the blocks are of the same type.
	if ( blockToMerge.name === targetBlockName ) {
		return true;
	}

	// If the blocks are of a different type, try to transform the block being
	// merged into the same type of block.
	const blocksToMerge = switchToBlockType( blockToMerge, targetBlockName );

	return blocksToMerge && blocksToMerge.length;
}

/**
 * Get partial selected blocks with their content updated
 * based on the selection.
 *
 * @param {Object} state Editor state.
 *
 * @return {Object[]} Updated partial selected blocks.
 */
export const __unstableGetSelectedBlocksWithPartialSelection = ( state ) => {
	const selectionAnchor = getSelectionStart( state );
	const selectionFocus = getSelectionEnd( state );

	if ( selectionAnchor.clientId === selectionFocus.clientId ) {
		return EMPTY_ARRAY;
	}

	// Can't split if the selection is not set.
	if (
		! selectionAnchor.attributeKey ||
		! selectionFocus.attributeKey ||
		typeof selectionAnchor.offset === 'undefined' ||
		typeof selectionFocus.offset === 'undefined'
	) {
		return EMPTY_ARRAY;
	}

	const anchorRootClientId = getBlockRootClientId(
		state,
		selectionAnchor.clientId
	);
	const focusRootClientId = getBlockRootClientId(
		state,
		selectionFocus.clientId
	);

	// It's not splittable if the selection doesn't start and end in the same
	// block list. Maybe in the future it should be allowed.
	if ( anchorRootClientId !== focusRootClientId ) {
		return EMPTY_ARRAY;
	}

	const blockOrder = getBlockOrder( state, anchorRootClientId );
	const anchorIndex = blockOrder.indexOf( selectionAnchor.clientId );
	const focusIndex = blockOrder.indexOf( selectionFocus.clientId );

	// Reassign selection start and end based on order.
	const [ selectionStart, selectionEnd ] =
		anchorIndex > focusIndex
			? [ selectionFocus, selectionAnchor ]
			: [ selectionAnchor, selectionFocus ];

	const blockA = getBlock( state, selectionStart.clientId );
	const blockB = getBlock( state, selectionEnd.clientId );

	const htmlA = blockA.attributes[ selectionStart.attributeKey ];
	const htmlB = blockB.attributes[ selectionEnd.attributeKey ];

	let valueA = create( { html: htmlA } );
	let valueB = create( { html: htmlB } );

	valueA = remove( valueA, 0, selectionStart.offset );
	valueB = remove( valueB, selectionEnd.offset, valueB.text.length );

	return [
		{
			...blockA,
			attributes: {
				...blockA.attributes,
				[ selectionStart.attributeKey ]: toHTMLString( {
					value: valueA,
				} ),
			},
		},
		{
			...blockB,
			attributes: {
				...blockB.attributes,
				[ selectionEnd.attributeKey ]: toHTMLString( {
					value: valueB,
				} ),
			},
		},
	];
};

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
	return state.blocks.order.get( rootClientId || '' ) || EMPTY_ARRAY;
}

/**
 * Returns the index at which the block corresponding to the specified client
 * ID occurs within the block order, or `-1` if the block does not exist.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {number} Index at which block exists in order.
 */
export function getBlockIndex( state, clientId ) {
	const rootClientId = getBlockRootClientId( state, clientId );
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
	const { selectionStart, selectionEnd } = state.selection;

	if ( selectionStart.clientId !== selectionEnd.clientId ) {
		return false;
	}

	return selectionStart.clientId === clientId;
}

/**
 * Returns true if one of the block's inner blocks is selected.
 *
 * @param {Object}  state    Editor state.
 * @param {string}  clientId Block client ID.
 * @param {boolean} deep     Perform a deep check.
 *
 * @return {boolean} Whether the block has an inner block selected
 */
export function hasSelectedInnerBlock( state, clientId, deep = false ) {
	const selectedBlockClientIds = getSelectedBlockClientIds( state );

	if ( ! selectedBlockClientIds.length ) {
		return false;
	}

	if ( deep ) {
		return selectedBlockClientIds.some( ( id ) =>
			// Pass true because we don't care about order and it's more
			// performant.
			getBlockParents( state, id, true ).includes( clientId )
		);
	}

	return selectedBlockClientIds.some(
		( id ) => getBlockRootClientId( state, id ) === clientId
	);
}

/**
 * Returns true if one of the block's inner blocks is dragged.
 *
 * @param {Object}  state    Editor state.
 * @param {string}  clientId Block client ID.
 * @param {boolean} deep     Perform a deep check.
 *
 * @return {boolean} Whether the block has an inner block dragged
 */
export function hasDraggedInnerBlock( state, clientId, deep = false ) {
	return getBlockOrder( state, clientId ).some(
		( innerClientId ) =>
			isBlockBeingDragged( state, innerClientId ) ||
			( deep && hasDraggedInnerBlock( state, innerClientId, deep ) )
	);
}

/**
 * Returns true if the block corresponding to the specified client ID is
 * currently selected but isn't the last of the selected blocks. Here "last"
 * refers to the block sequence in the document, _not_ the sequence of
 * multi-selection, which is why `state.selectionEnd` isn't used.
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
	const { selectionStart, selectionEnd } = state.selection;
	return selectionStart.clientId !== selectionEnd.clientId;
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
	return state.isMultiSelecting;
}

/**
 * Selector that returns if multi-selection is enabled or not.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} True if it should be possible to multi-select blocks, false if multi-selection is disabled.
 */
export function isSelectionEnabled( state ) {
	return state.isSelectionEnabled;
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
 * Returns true if the user is dragging blocks, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether user is dragging blocks.
 */
export function isDraggingBlocks( state ) {
	return !! state.draggedBlocks.length;
}

/**
 * Returns the client ids of any blocks being directly dragged.
 *
 * This does not include children of a parent being dragged.
 *
 * @param {Object} state Global application state.
 *
 * @return {string[]} Array of dragged block client ids.
 */
export function getDraggedBlockClientIds( state ) {
	return state.draggedBlocks;
}

/**
 * Returns whether the block is being dragged.
 *
 * Only returns true if the block is being directly dragged,
 * not if the block is a child of a parent being dragged.
 * See `isAncestorBeingDragged` for child blocks.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId Client id for block to check.
 *
 * @return {boolean} Whether the block is being dragged.
 */
export function isBlockBeingDragged( state, clientId ) {
	return state.draggedBlocks.includes( clientId );
}

/**
 * Returns whether a parent/ancestor of the block is being dragged.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId Client id for block to check.
 *
 * @return {boolean} Whether the block's ancestor is being dragged.
 */
export function isAncestorBeingDragged( state, clientId ) {
	// Return early if no blocks are being dragged rather than
	// the more expensive check for parents.
	if ( ! isDraggingBlocks( state ) ) {
		return false;
	}

	const parents = getBlockParents( state, clientId );
	return parents.some( ( parentClientId ) =>
		isBlockBeingDragged( state, parentClientId )
	);
}

/**
 * Returns true if the caret is within formatted text, or false otherwise.
 *
 * @deprecated
 *
 * @return {boolean} Whether the caret is within formatted text.
 */
export function isCaretWithinFormattedText() {
	deprecated(
		'wp.data.select( "core/block-editor" ).isCaretWithinFormattedText',
		{
			since: '6.1',
			version: '6.3',
		}
	);

	return false;
}

/**
 * Returns the location of the insertion cue. Defaults to the last index.
 *
 * @param {Object} state Editor state.
 *
 * @return {Object} Insertion point object with `rootClientId`, `index`.
 */
export const getBlockInsertionPoint = createSelector(
	( state ) => {
		let rootClientId, index;

		const {
			insertionCue,
			selection: { selectionEnd },
		} = state;
		if ( insertionCue !== null ) {
			return insertionCue;
		}

		const { clientId } = selectionEnd;

		if ( clientId ) {
			rootClientId = getBlockRootClientId( state, clientId ) || undefined;
			index = getBlockIndex( state, selectionEnd.clientId ) + 1;
		} else {
			index = getBlockOrder( state ).length;
		}

		return { rootClientId, index };
	},
	( state ) => [
		state.insertionCue,
		state.selection.selectionEnd.clientId,
		state.blocks.parents,
		state.blocks.order,
	]
);

/**
 * Returns true if the block insertion point is visible.
 *
 * @param {Object} state Global application state.
 *
 * @return {?boolean} Whether the insertion point is visible or not.
 */
export function isBlockInsertionPointVisible( state ) {
	return state.insertionCue !== null;
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
 *
 * @return {?Array} Block Template.
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
 * @return {string|false} Block Template Lock
 */
export function getTemplateLock( state, rootClientId ) {
	if ( ! rootClientId ) {
		return state.settings.templateLock ?? false;
	}

	return getBlockListSettings( state, rootClientId )?.templateLock ?? false;
}

/**
 * Determines if the given block type is allowed to be inserted into the block list.
 * This function is not exported and not memoized because using a memoized selector
 * inside another memoized selector is just a waste of time.
 *
 * @param {Object}        state        Editor state.
 * @param {string|Object} blockName    The block type object, e.g., the response
 *                                     from the block directory; or a string name of
 *                                     an installed block type, e.g.' core/paragraph'.
 * @param {?string}       rootClientId Optional root client ID of block list.
 *
 * @return {boolean} Whether the given block type is allowed to be inserted.
 */
const canInsertBlockTypeUnmemoized = (
	state,
	blockName,
	rootClientId = null
) => {
	let blockType;
	if ( blockName && 'object' === typeof blockName ) {
		blockType = blockName;
		blockName = blockType.name;
	} else {
		blockType = getBlockType( blockName );
	}
	if ( ! blockType ) {
		return false;
	}

	const { allowedBlockTypes } = getSettings( state );

	const isBlockAllowedInEditor = checkAllowList(
		allowedBlockTypes,
		blockName,
		true
	);
	if ( ! isBlockAllowedInEditor ) {
		return false;
	}

	const isLocked = !! getTemplateLock( state, rootClientId );
	if ( isLocked ) {
		return false;
	}

	const _isSectionBlock = !! isSectionBlock( state, rootClientId );
	if ( _isSectionBlock ) {
		return false;
	}

	if ( getBlockEditingMode( state, rootClientId ?? '' ) === 'disabled' ) {
		return false;
	}

	const parentBlockListSettings = getBlockListSettings( state, rootClientId );

	// The parent block doesn't have settings indicating it doesn't support
	// inner blocks, return false.
	if ( rootClientId && parentBlockListSettings === undefined ) {
		return false;
	}

	const parentName = getBlockName( state, rootClientId );
	const parentBlockType = getBlockType( parentName );

	// Look at the `blockType.allowedBlocks` field to determine whether this is an allowed child block.
	const parentAllowedChildBlocks = parentBlockType?.allowedBlocks;
	let hasParentAllowedBlock = checkAllowList(
		parentAllowedChildBlocks,
		blockName
	);

	// The `allowedBlocks` block list setting can further limit which blocks are allowed children.
	if ( hasParentAllowedBlock !== false ) {
		const parentAllowedBlocks = parentBlockListSettings?.allowedBlocks;
		const hasParentListAllowedBlock = checkAllowList(
			parentAllowedBlocks,
			blockName
		);
		// Never downgrade the result from `true` to `null`
		if ( hasParentListAllowedBlock !== null ) {
			hasParentAllowedBlock = hasParentListAllowedBlock;
		}
	}

	const blockAllowedParentBlocks = blockType.parent;
	const hasBlockAllowedParent = checkAllowList(
		blockAllowedParentBlocks,
		parentName
	);

	let hasBlockAllowedAncestor = true;
	const blockAllowedAncestorBlocks = blockType.ancestor;
	if ( blockAllowedAncestorBlocks ) {
		const ancestors = [
			rootClientId,
			...getBlockParents( state, rootClientId ),
		];

		hasBlockAllowedAncestor = ancestors.some( ( ancestorClientId ) =>
			checkAllowList(
				blockAllowedAncestorBlocks,
				getBlockName( state, ancestorClientId )
			)
		);
	}

	const canInsert =
		hasBlockAllowedAncestor &&
		( ( hasParentAllowedBlock === null &&
			hasBlockAllowedParent === null ) ||
			hasParentAllowedBlock === true ||
			hasBlockAllowedParent === true );

	if ( ! canInsert ) {
		return canInsert;
	}

	/**
	 * This filter is an ad-hoc solution to prevent adding template parts inside post content.
	 * Conceptually, having a filter inside a selector is bad pattern so this code will be
	 * replaced by a declarative API that doesn't the following drawbacks:
	 *
	 * Filters are not reactive: Upon switching between "template mode" and non "template mode",
	 * the filter and selector won't necessarily be executed again. For now, it doesn't matter much
	 * because you can't switch between the two modes while the inserter stays open.
	 *
	 * Filters are global: Once they're defined, they will affect all editor instances and all registries.
	 * An ideal API would only affect specific editor instances.
	 */
	return applyFilters(
		'blockEditor.__unstableCanInsertBlockType',
		canInsert,
		blockType,
		rootClientId,
		{
			// Pass bound selectors of the current registry. If we're in a nested
			// context, the data will differ from the one selected from the root
			// registry.
			getBlock: getBlock.bind( null, state ),
			getBlockParentsByBlockName: getBlockParentsByBlockName.bind(
				null,
				state
			),
		}
	);
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
	( state, blockName, rootClientId ) =>
		getInsertBlockTypeDependants( state, rootClientId )
);

/**
 * Determines if the given blocks are allowed to be inserted into the block
 * list.
 *
 * @param {Object}  state        Editor state.
 * @param {string}  clientIds    The block client IDs to be inserted.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {boolean} Whether the given blocks are allowed to be inserted.
 */
export function canInsertBlocks( state, clientIds, rootClientId = null ) {
	return clientIds.every( ( id ) =>
		canInsertBlockType( state, getBlockName( state, id ), rootClientId )
	);
}

/**
 * Determines if the given block is allowed to be deleted.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId The block client Id.
 *
 * @return {boolean} Whether the given block is allowed to be removed.
 */
export function canRemoveBlock( state, clientId ) {
	const attributes = getBlockAttributes( state, clientId );
	if ( attributes === null ) {
		return true;
	}
	if ( attributes.lock?.remove !== undefined ) {
		return ! attributes.lock.remove;
	}

	const rootClientId = getBlockRootClientId( state, clientId );
	if ( getTemplateLock( state, rootClientId ) ) {
		return false;
	}

	const isBlockWithinSection = !! getParentSectionBlock( state, clientId );
	if ( isBlockWithinSection ) {
		return false;
	}

	return getBlockEditingMode( state, rootClientId ) !== 'disabled';
}

/**
 * Determines if the given blocks are allowed to be removed.
 *
 * @param {Object} state     Editor state.
 * @param {string} clientIds The block client IDs to be removed.
 *
 * @return {boolean} Whether the given blocks are allowed to be removed.
 */
export function canRemoveBlocks( state, clientIds ) {
	return clientIds.every( ( clientId ) => canRemoveBlock( state, clientId ) );
}

/**
 * Determines if the given block is allowed to be moved.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId The block client Id.
 *
 * @return {boolean} Whether the given block is allowed to be moved.
 */
export function canMoveBlock( state, clientId ) {
	const attributes = getBlockAttributes( state, clientId );
	if ( attributes === null ) {
		return true;
	}
	if ( attributes.lock?.move !== undefined ) {
		return ! attributes.lock.move;
	}

	const rootClientId = getBlockRootClientId( state, clientId );
	if ( getTemplateLock( state, rootClientId ) === 'all' ) {
		return false;
	}
	return getBlockEditingMode( state, rootClientId ) !== 'disabled';
}

/**
 * Determines if the given blocks are allowed to be moved.
 *
 * @param {Object} state     Editor state.
 * @param {string} clientIds The block client IDs to be moved.
 *
 * @return {boolean} Whether the given blocks are allowed to be moved.
 */
export function canMoveBlocks( state, clientIds ) {
	return clientIds.every( ( clientId ) => canMoveBlock( state, clientId ) );
}

/**
 * Determines if the given block is allowed to be edited.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId The block client Id.
 *
 * @return {boolean} Whether the given block is allowed to be edited.
 */
export function canEditBlock( state, clientId ) {
	const attributes = getBlockAttributes( state, clientId );
	if ( attributes === null ) {
		return true;
	}

	const { lock } = attributes;

	// When the edit is true, we cannot edit the block.
	return ! lock?.edit;
}

/**
 * Determines if the given block type can be locked/unlocked by a user.
 *
 * @param {Object}          state      Editor state.
 * @param {(string|Object)} nameOrType Block name or type object.
 *
 * @return {boolean} Whether a given block type can be locked/unlocked.
 */
export function canLockBlockType( state, nameOrType ) {
	if ( ! hasBlockSupport( nameOrType, 'lock', true ) ) {
		return false;
	}

	// Use block editor settings as the default value.
	return !! state.settings?.canLockBlocks;
}

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
	return state.preferences.insertUsage?.[ id ] ?? null;
}

/**
 * Returns whether we can show a block type in the inserter
 *
 * @param {Object}  state        Global State
 * @param {Object}  blockType    BlockType
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
 * Return a function to be used to tranform a block variation to an inserter item
 *
 * @param {Object} state Global State
 * @param {Object} item  Denormalized inserter item
 * @return {Function} Function to transform a block variation to inserter item
 */
const getItemFromVariation = ( state, item ) => ( variation ) => {
	const variationId = `${ item.id }/${ variation.name }`;
	const { time, count = 0 } = getInsertUsage( state, variationId ) || {};
	return {
		...item,
		id: variationId,
		icon: variation.icon || item.icon,
		title: variation.title || item.title,
		description: variation.description || item.description,
		category: variation.category || item.category,
		// If `example` is explicitly undefined for the variation, the preview will not be shown.
		example: variation.hasOwnProperty( 'example' )
			? variation.example
			: item.example,
		initialAttributes: {
			...item.initialAttributes,
			...variation.attributes,
		},
		innerBlocks: variation.innerBlocks,
		keywords: variation.keywords || item.keywords,
		frecency: calculateFrecency( time, count ),
	};
};

/**
 * Returns the calculated frecency.
 *
 * 'frecency' is a heuristic (https://en.wikipedia.org/wiki/Frecency)
 * that combines block usage frequenty and recency.
 *
 * @param {number} time  When the last insert occurred as a UNIX epoch
 * @param {number} count The number of inserts that have occurred.
 *
 * @return {number} The calculated frecency.
 */
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

/**
 * Returns a function that accepts a block type and builds an item to be shown
 * in a specific context. It's used for building items for Inserter and available
 * block Transfroms list.
 *
 * @param {Object} state              Editor state.
 * @param {Object} options            Options object for handling the building of a block type.
 * @param {string} options.buildScope The scope for which the item is going to be used.
 * @return {Function} Function returns an item to be shown in a specific context (Inserter|Transforms list).
 */
const buildBlockTypeItem =
	( state, { buildScope = 'inserter' } ) =>
	( blockType ) => {
		const id = blockType.name;

		let isDisabled = false;
		if ( ! hasBlockSupport( blockType.name, 'multiple', true ) ) {
			isDisabled = getBlocksByClientId(
				state,
				getClientIdsWithDescendants( state )
			).some( ( { name } ) => name === blockType.name );
		}

		const { time, count = 0 } = getInsertUsage( state, id ) || {};
		const blockItemBase = {
			id,
			name: blockType.name,
			title: blockType.title,
			icon: blockType.icon,
			isDisabled,
			frecency: calculateFrecency( time, count ),
		};
		if ( buildScope === 'transform' ) {
			return blockItemBase;
		}

		const inserterVariations = getBlockVariations(
			blockType.name,
			'inserter'
		);
		return {
			...blockItemBase,
			initialAttributes: {},
			description: blockType.description,
			category: blockType.category,
			keywords: blockType.keywords,
			variations: inserterVariations,
			example: blockType.example,
			utility: 1, // Deprecated.
		};
	};

/**
 * Determines the items that appear in the inserter. Includes both static
 * items (e.g. a regular block type) and dynamic items (e.g. a reusable block).
 *
 * Each item object contains what's necessary to display a button in the
 * inserter and handle its selection.
 *
 * The 'frecency' property is a heuristic (https://en.wikipedia.org/wiki/Frecency)
 * that combines block usage frequenty and recency.
 *
 * Items are returned ordered descendingly by their 'utility' and 'frecency'.
 *
 * @param    {Object}   state             Editor state.
 * @param    {?string}  rootClientId      Optional root client ID of block list.
 *
 * @return {WPEditorInserterItem[]} Items that appear in inserter.
 *
 * @typedef {Object} WPEditorInserterItem
 * @property {string}   id                Unique identifier for the item.
 * @property {string}   name              The type of block to create.
 * @property {Object}   initialAttributes Attributes to pass to the newly created block.
 * @property {string}   title             Title of the item, as it appears in the inserter.
 * @property {string}   icon              Dashicon for the item, as it appears in the inserter.
 * @property {string}   category          Block category that the item is associated with.
 * @property {string[]} keywords          Keywords that can be searched to find this item.
 * @property {boolean}  isDisabled        Whether or not the user should be prevented from inserting
 *                                        this item.
 * @property {number}   frecency          Heuristic that combines frequency and recency.
 */
export const getInserterItems = createRegistrySelector( ( select ) =>
	createSelector(
		( state, rootClientId = null, options = DEFAULT_INSERTER_OPTIONS ) => {
			const buildReusableBlockInserterItem = ( reusableBlock ) => {
				const icon = ! reusableBlock.wp_pattern_sync_status
					? {
							src: symbol,
							foreground: 'var(--wp-block-synced-color)',
					  }
					: symbol;
				const id = `core/block/${ reusableBlock.id }`;
				const { time, count = 0 } = getInsertUsage( state, id ) || {};
				const frecency = calculateFrecency( time, count );

				return {
					id,
					name: 'core/block',
					initialAttributes: { ref: reusableBlock.id },
					title: reusableBlock.title?.raw,
					icon,
					category: 'reusable',
					keywords: [ 'reusable' ],
					isDisabled: false,
					utility: 1, // Deprecated.
					frecency,
					content: reusableBlock.content?.raw,
					syncStatus: reusableBlock.wp_pattern_sync_status,
				};
			};

			const syncedPatternInserterItems = canInsertBlockTypeUnmemoized(
				state,
				'core/block',
				rootClientId
			)
				? unlock( select( STORE_NAME ) )
						.getReusableBlocks()
						.map( buildReusableBlockInserterItem )
				: [];

			const buildBlockTypeInserterItem = buildBlockTypeItem( state, {
				buildScope: 'inserter',
			} );

			let blockTypeInserterItems = getBlockTypes()
				.filter( ( blockType ) =>
					hasBlockSupport( blockType, 'inserter', true )
				)
				.map( buildBlockTypeInserterItem );

			if ( options[ isFiltered ] !== false ) {
				blockTypeInserterItems = blockTypeInserterItems.filter(
					( blockType ) =>
						canIncludeBlockTypeInInserter(
							state,
							blockType,
							rootClientId
						)
				);
			} else {
				blockTypeInserterItems = blockTypeInserterItems.map(
					( blockType ) => ( {
						...blockType,
						isAllowedInCurrentRoot: canIncludeBlockTypeInInserter(
							state,
							blockType,
							rootClientId
						),
					} )
				);
			}

			const items = blockTypeInserterItems.reduce(
				( accumulator, item ) => {
					const { variations = [] } = item;
					// Exclude any block type item that is to be replaced by a default variation.
					if ( ! variations.some( ( { isDefault } ) => isDefault ) ) {
						accumulator.push( item );
					}
					if ( variations.length ) {
						const variationMapper = getItemFromVariation(
							state,
							item
						);
						accumulator.push(
							...variations.map( variationMapper )
						);
					}
					return accumulator;
				},
				[]
			);

			// Ensure core blocks are prioritized in the returned results,
			// because third party blocks can be registered earlier than
			// the core blocks (usually by using the `init` action),
			// thus affecting the display order.
			// We don't sort reusable blocks as they are handled differently.
			const groupByType = ( blocks, block ) => {
				const { core, noncore } = blocks;
				const type = block.name.startsWith( 'core/' ) ? core : noncore;

				type.push( block );
				return blocks;
			};
			const { core: coreItems, noncore: nonCoreItems } = items.reduce(
				groupByType,
				{ core: [], noncore: [] }
			);
			const sortedBlockTypes = [ ...coreItems, ...nonCoreItems ];
			return [ ...sortedBlockTypes, ...syncedPatternInserterItems ];
		},
		( state, rootClientId ) => [
			getBlockTypes(),
			unlock( select( STORE_NAME ) ).getReusableBlocks(),
			state.blocks.order,
			state.preferences.insertUsage,
			...getInsertBlockTypeDependants( state, rootClientId ),
		]
	)
);

/**
 * Determines the items that appear in the available block transforms list.
 *
 * Each item object contains what's necessary to display a menu item in the
 * transform list and handle its selection.
 *
 * The 'frecency' property is a heuristic (https://en.wikipedia.org/wiki/Frecency)
 * that combines block usage frequenty and recency.
 *
 * Items are returned ordered descendingly by their 'frecency'.
 *
 * @param    {Object}          state        Editor state.
 * @param    {Object|Object[]} blocks       Block object or array objects.
 * @param    {?string}         rootClientId Optional root client ID of block list.
 *
 * @return {WPEditorTransformItem[]} Items that appear in inserter.
 *
 * @typedef {Object} WPEditorTransformItem
 * @property {string}          id           Unique identifier for the item.
 * @property {string}          name         The type of block to create.
 * @property {string}          title        Title of the item, as it appears in the inserter.
 * @property {string}          icon         Dashicon for the item, as it appears in the inserter.
 * @property {boolean}         isDisabled   Whether or not the user should be prevented from inserting
 *                                          this item.
 * @property {number}          frecency     Heuristic that combines frequency and recency.
 */
export const getBlockTransformItems = createSelector(
	( state, blocks, rootClientId = null ) => {
		const normalizedBlocks = Array.isArray( blocks ) ? blocks : [ blocks ];
		const buildBlockTypeTransformItem = buildBlockTypeItem( state, {
			buildScope: 'transform',
		} );
		const blockTypeTransformItems = getBlockTypes()
			.filter( ( blockType ) =>
				canIncludeBlockTypeInInserter( state, blockType, rootClientId )
			)
			.map( buildBlockTypeTransformItem );

		const itemsByName = Object.fromEntries(
			Object.entries( blockTypeTransformItems ).map( ( [ , value ] ) => [
				value.name,
				value,
			] )
		);

		const possibleTransforms = getPossibleBlockTransformations(
			normalizedBlocks
		).reduce( ( accumulator, block ) => {
			if ( itemsByName[ block?.name ] ) {
				accumulator.push( itemsByName[ block.name ] );
			}
			return accumulator;
		}, [] );
		return orderBy(
			possibleTransforms,
			( block ) => itemsByName[ block.name ].frecency,
			'desc'
		);
	},
	( state, blocks, rootClientId ) => [
		getBlockTypes(),
		state.preferences.insertUsage,
		...getInsertBlockTypeDependants( state, rootClientId ),
	]
);

/**
 * Determines whether there are items to show in the inserter.
 *
 * @param {Object}  state        Editor state.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {boolean} Items that appear in inserter.
 */
export const hasInserterItems = createRegistrySelector(
	( select ) =>
		( state, rootClientId = null ) => {
			const hasBlockType = getBlockTypes().some( ( blockType ) =>
				canIncludeBlockTypeInInserter( state, blockType, rootClientId )
			);
			if ( hasBlockType ) {
				return true;
			}
			const hasReusableBlock =
				canInsertBlockTypeUnmemoized(
					state,
					'core/block',
					rootClientId
				) &&
				unlock( select( STORE_NAME ) ).getReusableBlocks().length > 0;

			return hasReusableBlock;
		}
);

/**
 * Returns the list of allowed inserter blocks for inner blocks children.
 *
 * @param {Object}  state        Editor state.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {Array?} The list of allowed block types.
 */
export const getAllowedBlocks = createRegistrySelector( ( select ) =>
	createSelector(
		( state, rootClientId = null ) => {
			if ( ! rootClientId ) {
				return;
			}

			const blockTypes = getBlockTypes().filter( ( blockType ) =>
				canIncludeBlockTypeInInserter( state, blockType, rootClientId )
			);

			const hasReusableBlock =
				canInsertBlockTypeUnmemoized(
					state,
					'core/block',
					rootClientId
				) &&
				unlock( select( STORE_NAME ) ).getReusableBlocks().length > 0;

			if ( hasReusableBlock ) {
				blockTypes.push( 'core/block' );
			}

			return blockTypes;
		},
		( state, rootClientId ) => [
			getBlockTypes(),
			unlock( select( STORE_NAME ) ).getReusableBlocks(),
			...getInsertBlockTypeDependants( state, rootClientId ),
		]
	)
);

export const __experimentalGetAllowedBlocks = createSelector(
	( state, rootClientId = null ) => {
		deprecated(
			'wp.data.select( "core/block-editor" ).__experimentalGetAllowedBlocks',
			{
				alternative:
					'wp.data.select( "core/block-editor" ).getAllowedBlocks',
				since: '6.2',
				version: '6.4',
			}
		);
		return getAllowedBlocks( state, rootClientId );
	},
	( state, rootClientId ) =>
		getAllowedBlocks.getDependants( state, rootClientId )
);

/**
 * Returns the block to be directly inserted by the block appender.
 *
 * @param    {Object}         state            Editor state.
 * @param    {?string}        rootClientId     Optional root client ID of block list.
 *
 * @return {WPDirectInsertBlock|undefined}              The block type to be directly inserted.
 *
 * @typedef {Object} WPDirectInsertBlock
 * @property {string}         name             The type of block.
 * @property {?Object}        attributes       Attributes to pass to the newly created block.
 * @property {?Array<string>} attributesToCopy Attributes to be copied from adjecent blocks when inserted.
 */
export function getDirectInsertBlock( state, rootClientId = null ) {
	if ( ! rootClientId ) {
		return;
	}
	const { defaultBlock, directInsert } =
		state.blockListSettings[ rootClientId ] ?? {};
	if ( ! defaultBlock || ! directInsert ) {
		return;
	}

	return defaultBlock;
}

export function __experimentalGetDirectInsertBlock(
	state,
	rootClientId = null
) {
	deprecated(
		'wp.data.select( "core/block-editor" ).__experimentalGetDirectInsertBlock',
		{
			alternative:
				'wp.data.select( "core/block-editor" ).getDirectInsertBlock',
			since: '6.3',
			version: '6.4',
		}
	);
	return getDirectInsertBlock( state, rootClientId );
}

export const __experimentalGetParsedPattern = createRegistrySelector(
	( select ) => ( state, patternName ) => {
		const pattern = unlock( select( STORE_NAME ) ).getPatternBySlug(
			patternName
		);
		return pattern ? getParsedPattern( pattern ) : null;
	}
);

const getAllowedPatternsDependants = ( select ) => ( state, rootClientId ) => [
	...getAllPatternsDependants( select )( state ),
	...getInsertBlockTypeDependants( state, rootClientId ),
];

/**
 * Returns the list of allowed patterns for inner blocks children.
 *
 * @param {Object}  state        Editor state.
 * @param {?string} rootClientId Optional target root client ID.
 *
 * @return {Array?} The list of allowed patterns.
 */
export const __experimentalGetAllowedPatterns = createRegistrySelector(
	( select ) => {
		return createSelector( ( state, rootClientId = null ) => {
			const { getAllPatterns } = unlock( select( STORE_NAME ) );
			const patterns = getAllPatterns();
			const { allowedBlockTypes } = getSettings( state );
			const parsedPatterns = patterns
				.filter( ( { inserter = true } ) => !! inserter )
				.map( ( pattern ) => {
					return {
						...pattern,
						get blocks() {
							return getParsedPattern( pattern ).blocks;
						},
					};
				} );

			const availableParsedPatterns = parsedPatterns.filter(
				( pattern ) =>
					checkAllowListRecursive(
						getGrammar( pattern ),
						allowedBlockTypes
					)
			);
			const patternsAllowed = availableParsedPatterns.filter(
				( pattern ) =>
					getGrammar( pattern ).every( ( { blockName: name } ) =>
						canInsertBlockType( state, name, rootClientId )
					)
			);

			return patternsAllowed;
		}, getAllowedPatternsDependants( select ) );
	}
);

/**
 * Returns the list of patterns based on their declared `blockTypes`
 * and a block's name.
 * Patterns can use `blockTypes` to integrate in work flows like
 * suggesting appropriate patterns in a Placeholder state(during insertion)
 * or blocks transformations.
 *
 * @param {Object}          state        Editor state.
 * @param {string|string[]} blockNames   Block's name or array of block names to find matching pattens.
 * @param {?string}         rootClientId Optional target root client ID.
 *
 * @return {Array} The list of matched block patterns based on declared `blockTypes` and block name.
 */
export const getPatternsByBlockTypes = createRegistrySelector( ( select ) =>
	createSelector(
		( state, blockNames, rootClientId = null ) => {
			if ( ! blockNames ) {
				return EMPTY_ARRAY;
			}
			const patterns =
				select( STORE_NAME ).__experimentalGetAllowedPatterns(
					rootClientId
				);
			const normalizedBlockNames = Array.isArray( blockNames )
				? blockNames
				: [ blockNames ];
			const filteredPatterns = patterns.filter( ( pattern ) =>
				pattern?.blockTypes?.some?.( ( blockName ) =>
					normalizedBlockNames.includes( blockName )
				)
			);
			if ( filteredPatterns.length === 0 ) {
				return EMPTY_ARRAY;
			}
			return filteredPatterns;
		},
		( state, blockNames, rootClientId ) =>
			getAllowedPatternsDependants( select )( state, rootClientId )
	)
);

export const __experimentalGetPatternsByBlockTypes = createRegistrySelector(
	( select ) => {
		deprecated(
			'wp.data.select( "core/block-editor" ).__experimentalGetPatternsByBlockTypes',
			{
				alternative:
					'wp.data.select( "core/block-editor" ).getPatternsByBlockTypes',
				since: '6.2',
				version: '6.4',
			}
		);
		return select( STORE_NAME ).getPatternsByBlockTypes;
	}
);

/**
 * Determines the items that appear in the available pattern transforms list.
 *
 * For now we only handle blocks without InnerBlocks and take into account
 * the `role` property of blocks' attributes for the transformation.
 *
 * We return the first set of possible eligible block patterns,
 * by checking the `blockTypes` property. We still have to recurse through
 * block pattern's blocks and try to find matches from the selected blocks.
 * Now this happens in the consumer to avoid heavy operations in the selector.
 *
 * @param {Object}   state        Editor state.
 * @param {Object[]} blocks       The selected blocks.
 * @param {?string}  rootClientId Optional root client ID of block list.
 *
 * @return {WPBlockPattern[]} Items that are eligible for a pattern transformation.
 */
export const __experimentalGetPatternTransformItems = createRegistrySelector(
	( select ) =>
		createSelector(
			( state, blocks, rootClientId = null ) => {
				if ( ! blocks ) {
					return EMPTY_ARRAY;
				}
				/**
				 * For now we only handle blocks without InnerBlocks and take into account
				 * the `role` property of blocks' attributes for the transformation.
				 * Note that the blocks have been retrieved through `getBlock`, which doesn't
				 * return the inner blocks of an inner block controller, so we still need
				 * to check for this case too.
				 */
				if (
					blocks.some(
						( { clientId, innerBlocks } ) =>
							innerBlocks.length ||
							areInnerBlocksControlled( state, clientId )
					)
				) {
					return EMPTY_ARRAY;
				}

				// Create a Set of the selected block names that is used in patterns filtering.
				const selectedBlockNames = Array.from(
					new Set( blocks.map( ( { name } ) => name ) )
				);
				/**
				 * Here we will return first set of possible eligible block patterns,
				 * by checking the `blockTypes` property. We still have to recurse through
				 * block pattern's blocks and try to find matches from the selected blocks.
				 * Now this happens in the consumer to avoid heavy operations in the selector.
				 */
				return select( STORE_NAME ).getPatternsByBlockTypes(
					selectedBlockNames,
					rootClientId
				);
			},
			( state, blocks, rootClientId ) =>
				getAllowedPatternsDependants( select )( state, rootClientId )
		)
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
 * Returns the block list settings for an array of blocks, if any exist.
 *
 * @param {Object} state     Editor state.
 * @param {Array}  clientIds Block client IDs.
 *
 * @return {Object} An object where the keys are client ids and the values are
 *                  a block list setting object.
 */
export const __experimentalGetBlockListSettingsForBlocks = createSelector(
	( state, clientIds = [] ) => {
		return clientIds.reduce( ( blockListSettingsForBlocks, clientId ) => {
			if ( ! state.blockListSettings[ clientId ] ) {
				return blockListSettingsForBlocks;
			}

			return {
				...blockListSettingsForBlocks,
				[ clientId ]: state.blockListSettings[ clientId ],
			};
		}, {} );
	},
	( state ) => [ state.blockListSettings ]
);

/**
 * Returns the title of a given reusable block
 *
 * @param {Object}        state Global application state.
 * @param {number|string} ref   The shared block's ID.
 *
 * @return {string} The reusable block saved title.
 */
export const __experimentalGetReusableBlockTitle = createRegistrySelector(
	( select ) =>
		createSelector(
			( state, ref ) => {
				deprecated(
					"wp.data.select( 'core/block-editor' ).__experimentalGetReusableBlockTitle",
					{
						since: '6.6',
						version: '6.8',
					}
				);

				const reusableBlock = unlock( select( STORE_NAME ) )
					.getReusableBlocks()
					.find( ( block ) => block.id === ref );
				if ( ! reusableBlock ) {
					return null;
				}

				return reusableBlock.title?.raw;
			},
			() => [ unlock( select( STORE_NAME ) ).getReusableBlocks() ]
		)
);

/**
 * Returns true if the most recent block change is be considered ignored, or
 * false otherwise. An ignored change is one not to be committed by
 * BlockEditorProvider, neither via `onChange` nor `onInput`.
 *
 * @param {Object} state Block editor state.
 *
 * @return {boolean} Whether the most recent block change was ignored.
 */
export function __unstableIsLastBlockChangeIgnored( state ) {
	// TODO: Removal Plan: Changes incurred by RECEIVE_BLOCKS should not be
	// ignored if in-fact they result in a change in blocks state. The current
	// need to ignore changes not a result of user interaction should be
	// accounted for in the refactoring of reusable blocks as occurring within
	// their own separate block editor / state (#7119).
	return state.blocks.isIgnoredChange;
}

/**
 * Returns the block attributes changed as a result of the last dispatched
 * action.
 *
 * @param {Object} state Block editor state.
 *
 * @return {Object<string,Object>} Subsets of block attributes changed, keyed
 *                                 by block client ID.
 */
export function __experimentalGetLastBlockAttributeChanges( state ) {
	return state.lastBlockAttributesChange;
}

/**
 * Returns whether the navigation mode is enabled.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Is navigation mode enabled.
 */
export function isNavigationMode( state ) {
	return state.editorMode === 'navigation';
}

/**
 * Returns the current editor mode.
 *
 * @param {Object} state Editor state.
 *
 * @return {string} the editor mode.
 */
export function __unstableGetEditorMode( state ) {
	return state.editorMode;
}

/**
 * Returns whether block moving mode is enabled.
 *
 * @deprecated
 */
export function hasBlockMovingClientId() {
	deprecated(
		'wp.data.select( "core/block-editor" ).hasBlockMovingClientId',
		{
			since: '6.7',
			hint: 'Block moving mode feature has been removed',
		}
	);
	return false;
}

/**
 * Returns true if the last change was an automatic change, false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the last change was automatic.
 */
export function didAutomaticChange( state ) {
	return !! state.automaticChangeStatus;
}

/**
 * Returns true if the current highlighted block matches the block clientId.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId The block to check.
 *
 * @return {boolean} Whether the block is currently highlighted.
 */
export function isBlockHighlighted( state, clientId ) {
	return state.highlightedBlock === clientId;
}

/**
 * Checks if a given block has controlled inner blocks.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId The block to check.
 *
 * @return {boolean} True if the block has controlled inner blocks.
 */
export function areInnerBlocksControlled( state, clientId ) {
	return !! state.blocks.controlledInnerBlocks[ clientId ];
}

/**
 * Returns the clientId for the first 'active' block of a given array of block names.
 * A block is 'active' if it (or a child) is the selected block.
 * Returns the first match moving up the DOM from the selected block.
 *
 * @param {Object}   state            Global application state.
 * @param {string[]} validBlocksNames The names of block types to check for.
 *
 * @return {string} The matching block's clientId.
 */
export const __experimentalGetActiveBlockIdByBlockNames = createSelector(
	( state, validBlockNames ) => {
		if ( ! validBlockNames.length ) {
			return null;
		}
		// Check if selected block is a valid entity area.
		const selectedBlockClientId = getSelectedBlockClientId( state );
		if (
			validBlockNames.includes(
				getBlockName( state, selectedBlockClientId )
			)
		) {
			return selectedBlockClientId;
		}
		// Check if first selected block is a child of a valid entity area.
		const multiSelectedBlockClientIds =
			getMultiSelectedBlockClientIds( state );
		const entityAreaParents = getBlockParentsByBlockName(
			state,
			selectedBlockClientId || multiSelectedBlockClientIds[ 0 ],
			validBlockNames
		);
		if ( entityAreaParents ) {
			// Last parent closest/most interior.
			return entityAreaParents[ entityAreaParents.length - 1 ];
		}
		return null;
	},
	( state, validBlockNames ) => [
		state.selection.selectionStart.clientId,
		state.selection.selectionEnd.clientId,
		validBlockNames,
	]
);

/**
 * Tells if the block with the passed clientId was just inserted.
 *
 * @param {Object}  state    Global application state.
 * @param {Object}  clientId Client Id of the block.
 * @param {?string} source   Optional insertion source of the block.
 * @return {boolean} True if the block matches the last block inserted from the specified source.
 */
export function wasBlockJustInserted( state, clientId, source ) {
	const { lastBlockInserted } = state;
	return (
		lastBlockInserted.clientIds?.includes( clientId ) &&
		lastBlockInserted.source === source
	);
}

/**
 * Tells if the block is visible on the canvas or not.
 *
 * @param {Object} state    Global application state.
 * @param {Object} clientId Client Id of the block.
 * @return {boolean} True if the block is visible.
 */
export function isBlockVisible( state, clientId ) {
	return state.blockVisibility?.[ clientId ] ?? true;
}

/**
 * Returns the currently hovered block.
 *
 * @param {Object} state Global application state.
 * @return {Object} Client Id of the hovered block.
 */
export function getHoveredBlockClientId( state ) {
	return state.hoveredBlockClientId;
}

/**
 * Returns the list of all hidden blocks.
 *
 * @param {Object} state Global application state.
 * @return {[string]} List of hidden blocks.
 */
export const __unstableGetVisibleBlocks = createSelector(
	( state ) => {
		const visibleBlocks = new Set(
			Object.keys( state.blockVisibility ).filter(
				( key ) => state.blockVisibility[ key ]
			)
		);
		if ( visibleBlocks.size === 0 ) {
			return EMPTY_SET;
		}
		return visibleBlocks;
	},
	( state ) => [ state.blockVisibility ]
);

export function __unstableHasActiveBlockOverlayActive( state, clientId ) {
	// Prevent overlay on blocks with a non-default editing mode. If the mdoe is
	// 'disabled' then the overlay is redundant since the block can't be
	// selected. If the mode is 'contentOnly' then the overlay is redundant
	// since there will be no controls to interact with once selected.
	if ( getBlockEditingMode( state, clientId ) !== 'default' ) {
		return false;
	}

	// If the block editing is locked, the block overlay is always active.
	if ( ! canEditBlock( state, clientId ) ) {
		return true;
	}

	const editorMode = __unstableGetEditorMode( state );

	// In zoom-out mode, the block overlay is always active for section level blocks.
	if ( editorMode === 'zoom-out' ) {
		const sectionRootClientId = getSectionRootClientId( state );
		if ( sectionRootClientId ) {
			const sectionClientIds = getBlockOrder(
				state,
				sectionRootClientId
			);
			if ( sectionClientIds?.includes( clientId ) ) {
				return true;
			}
		} else if ( clientId && ! getBlockRootClientId( state, clientId ) ) {
			return true;
		}
	}

	// In navigation mode, the block overlay is active when the block is not
	// selected (and doesn't contain a selected child). The same behavior is
	// also enabled in all modes for blocks that have controlled children
	// (reusable block, template part, navigation), unless explicitly disabled
	// with `supports.__experimentalDisableBlockOverlay`.
	const blockSupportDisable = hasBlockSupport(
		getBlockName( state, clientId ),
		'__experimentalDisableBlockOverlay',
		false
	);
	const shouldEnableIfUnselected = blockSupportDisable
		? false
		: areInnerBlocksControlled( state, clientId );

	return (
		shouldEnableIfUnselected &&
		! isBlockSelected( state, clientId ) &&
		! hasSelectedInnerBlock( state, clientId, true )
	);
}

export function __unstableIsWithinBlockOverlay( state, clientId ) {
	let parent = state.blocks.parents.get( clientId );
	while ( !! parent ) {
		if ( __unstableHasActiveBlockOverlayActive( state, parent ) ) {
			return true;
		}
		parent = state.blocks.parents.get( parent );
	}
	return false;
}

function isWithinBlock( state, clientId, parentClientId ) {
	let parent = state.blocks.parents.get( clientId );
	while ( !! parent && parent !== parentClientId ) {
		parent = state.blocks.parents.get( parent );
	}
	return parent === parentClientId;
}

/**
 * @typedef {import('../components/block-editing-mode').BlockEditingMode} BlockEditingMode
 */

/**
 * Returns the block editing mode for a given block.
 *
 * The mode can be one of three options:
 *
 * - `'disabled'`: Prevents editing the block entirely, i.e. it cannot be
 *   selected.
 * - `'contentOnly'`: Hides all non-content UI, e.g. auxiliary controls in the
 *   toolbar, the block movers, block settings.
 * - `'default'`: Allows editing the block as normal.
 *
 * Blocks can set a mode using the `useBlockEditingMode` hook.
 *
 * The mode is inherited by all of the block's inner blocks, unless they have
 * their own mode.
 *
 * A template lock can also set a mode. If the template lock is `'contentOnly'`,
 * the block's mode is overridden to `'contentOnly'` if the block has a content
 * role attribute, or `'disabled'` otherwise.
 *
 * @see useBlockEditingMode
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId The block client ID, or `''` for the root container.
 *
 * @return {BlockEditingMode} The block editing mode. One of `'disabled'`,
 *                            `'contentOnly'`, or `'default'`.
 */
export const getBlockEditingMode = createRegistrySelector(
	( select ) =>
		( state, clientId = '' ) => {
			// Some selectors that call this provide `null` as the default
			// rootClientId, but the default rootClientId is actually `''`.
			if ( clientId === null ) {
				clientId = '';
			}

			// In zoom-out mode, override the behavior set by
			// __unstableSetBlockEditingMode to only allow editing the top-level
			// sections.
			const editorMode = __unstableGetEditorMode( state );
			if ( editorMode === 'zoom-out' ) {
				const sectionRootClientId = getSectionRootClientId( state );

				if ( clientId === '' /* ROOT_CONTAINER_CLIENT_ID */ ) {
					return sectionRootClientId ? 'disabled' : 'contentOnly';
				}
				if ( clientId === sectionRootClientId ) {
					return 'contentOnly';
				}
				const sectionsClientIds = getBlockOrder(
					state,
					sectionRootClientId
				);

				// Sections are always contentOnly.
				if ( sectionsClientIds?.includes( clientId ) ) {
					return 'contentOnly';
				}

				return 'disabled';
			}

			if ( editorMode === 'navigation' ) {
				const sectionRootClientId = getSectionRootClientId( state );

				// The root section is "default mode"
				if ( clientId === sectionRootClientId ) {
					return 'default';
				}

				// Sections should always be contentOnly in navigation mode.
				const sectionsClientIds = getBlockOrder(
					state,
					sectionRootClientId
				);
				if ( sectionsClientIds.includes( clientId ) ) {
					return 'contentOnly';
				}

				// Blocks outside sections should be disabled.
				const isWithinSectionRoot = isWithinBlock(
					state,
					clientId,
					sectionRootClientId
				);
				if ( ! isWithinSectionRoot ) {
					return 'disabled';
				}

				// The rest of the blocks depend on whether they are content blocks or not.
				// This "flattens" the sections tree.
				const name = getBlockName( state, clientId );
				const { hasContentRoleAttribute } = unlock(
					select( blocksStore )
				);
				const isContent = hasContentRoleAttribute( name );

				return isContent ? 'contentOnly' : 'disabled';
			}

			// In normal mode, consider that an explicitely set editing mode takes over.
			const blockEditingMode = state.blockEditingModes.get( clientId );
			if ( blockEditingMode ) {
				return blockEditingMode;
			}

			// In normal mode, top level is default mode.
			if ( ! clientId ) {
				return 'default';
			}

			const rootClientId = getBlockRootClientId( state, clientId );
			const templateLock = getTemplateLock( state, rootClientId );
			// If the parent of the block is contentOnly locked, check whether it's a content block.
			if ( templateLock === 'contentOnly' ) {
				const name = getBlockName( state, clientId );
				const { hasContentRoleAttribute } = unlock(
					select( blocksStore )
				);
				const isContent = hasContentRoleAttribute( name );
				return isContent ? 'contentOnly' : 'disabled';
			}
			// Otherwise, check if there's an ancestor that is contentOnly
			const parentMode = getBlockEditingMode( state, rootClientId );
			return parentMode === 'contentOnly' ? 'default' : parentMode;
		}
);

/**
 * Indicates if a block is ungroupable.
 * A block is ungroupable if it is a single grouping block with inner blocks.
 * If a block has an `ungroup` transform, it is also ungroupable, without the
 * requirement of being the default grouping block.
 * Additionally a block can only be ungrouped if it has inner blocks and can
 * be removed.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId Client Id of the block. If not passed the selected block's client id will be used.
 * @return {boolean} True if the block is ungroupable.
 */
export const isUngroupable = createRegistrySelector(
	( select ) =>
		( state, clientId = '' ) => {
			const _clientId = clientId || getSelectedBlockClientId( state );
			if ( ! _clientId ) {
				return false;
			}
			const { getGroupingBlockName } = select( blocksStore );
			const block = getBlock( state, _clientId );
			const groupingBlockName = getGroupingBlockName();
			const _isUngroupable =
				block &&
				( block.name === groupingBlockName ||
					getBlockType( block.name )?.transforms?.ungroup ) &&
				!! block.innerBlocks.length;

			return _isUngroupable && canRemoveBlock( state, _clientId );
		}
);

/**
 * Indicates if the provided blocks(by client ids) are groupable.
 * We need to have at least one block, have a grouping block name set and
 * be able to remove these blocks.
 *
 * @param {Object}   state     Global application state.
 * @param {string[]} clientIds Block client ids. If not passed the selected blocks client ids will be used.
 * @return {boolean} True if the blocks are groupable.
 */
export const isGroupable = createRegistrySelector(
	( select ) =>
		( state, clientIds = EMPTY_ARRAY ) => {
			const { getGroupingBlockName } = select( blocksStore );
			const groupingBlockName = getGroupingBlockName();
			const _clientIds = clientIds?.length
				? clientIds
				: getSelectedBlockClientIds( state );
			const rootClientId = _clientIds?.length
				? getBlockRootClientId( state, _clientIds[ 0 ] )
				: undefined;
			const groupingBlockAvailable = canInsertBlockType(
				state,
				groupingBlockName,
				rootClientId
			);
			const _isGroupable = groupingBlockAvailable && _clientIds.length;
			return _isGroupable && canRemoveBlocks( state, _clientIds );
		}
);

/**
 * DO-NOT-USE in production.
 * This selector is created for internal/experimental only usage and may be
 * removed anytime without any warning, causing breakage on any plugin or theme invoking it.
 *
 * @deprecated
 *
 * @param {Object} state    Global application state.
 * @param {Object} clientId Client Id of the block.
 *
 * @return {?string} Client ID of the ancestor block that is content locking the block.
 */
export const __unstableGetContentLockingParent = ( state, clientId ) => {
	deprecated(
		"wp.data.select( 'core/block-editor' ).__unstableGetContentLockingParent",
		{
			since: '6.1',
			version: '6.7',
		}
	);
	return getContentLockingParent( state, clientId );
};

/**
 * DO-NOT-USE in production.
 * This selector is created for internal/experimental only usage and may be
 * removed anytime without any warning, causing breakage on any plugin or theme invoking it.
 *
 * @deprecated
 *
 * @param {Object} state Global application state.
 */
export function __unstableGetTemporarilyEditingAsBlocks( state ) {
	deprecated(
		"wp.data.select( 'core/block-editor' ).__unstableGetTemporarilyEditingAsBlocks",
		{
			since: '6.1',
			version: '6.7',
		}
	);
	return getTemporarilyEditingAsBlocks( state );
}

/**
 * DO-NOT-USE in production.
 * This selector is created for internal/experimental only usage and may be
 * removed anytime without any warning, causing breakage on any plugin or theme invoking it.
 *
 * @deprecated
 *
 * @param {Object} state Global application state.
 */
export function __unstableGetTemporarilyEditingFocusModeToRevert( state ) {
	deprecated(
		"wp.data.select( 'core/block-editor' ).__unstableGetTemporarilyEditingFocusModeToRevert",
		{
			since: '6.5',
			version: '6.7',
		}
	);
	return getTemporarilyEditingFocusModeToRevert( state );
}
