/**
 * WordPress dependencies
 */
import {
	getBlockType,
	getBlockTypes,
	getBlockVariations,
	getDefaultBlockName,
	hasBlockSupport,
	getPossibleBlockTransformations,
	switchToBlockType,
	store as blocksStore,
	privateApis as blocksPrivateApis,
} from '@wordpress/blocks';
import type { BlockType, Block, BlockVariation } from '@wordpress/blocks';
import { applyFilters } from '@wordpress/hooks';
import { symbol } from '@wordpress/icons';
import { create, remove, toHTMLString } from '@wordpress/rich-text';
import deprecated from '@wordpress/deprecated';
import type { select as globalSelect } from '@wordpress/data';
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
	mapUserPattern,
} from './utils';
import { orderBy } from '../utils/sorting';
import { STORE_NAME } from './constants';
import { unlock } from '../lock-unlock';
import type {
	BlockAttributes,
	State,
	TemplateState,
	BlockListSettings,
	EditorSettings,
	UserPattern,
	Pattern,
} from './types';

import {
	getContentLockingParent,
	getEditedContentOnlySection,
	getSectionRootClientId,
	isSectionBlock,
	getParentSectionBlock,
	isZoomOut,
	isContainerInsertableToInContentOnlyMode,
	getClientIdWithClientIdsTree,
	getClientIdsTree,
} from './private-selectors';

const { isContentBlock } = unlock( blocksPrivateApis );

/**
 * A block selection object.
 *
 * This type is duplicated to avoid creating circular dependencies.
 *
 * @see {import("@wordpress/block-editor/src/store/actions").WPBlockSelection}
 * @see {import("@wordpress/core-data/src/types").WPBlockSelection}
 * @see {import("@wordpress/editor/src/store/selectors").WPBlockSelection}
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
const EMPTY_ARRAY: string[] = [];

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
 * @param state    Editor state.
 * @param clientId Block client ID.
 *
 * @return Block name.
 */
export function getBlockName(
	state: State,
	clientId: string | undefined | null
): string | null {
	if ( ! clientId ) {
		return null;
	}
	const block = state.blocks.byClientId.get( clientId );
	return block ? block.name : null;
}

/**
 * Returns whether a block is valid or not.
 *
 * @param state    Editor state.
 * @param clientId Block client ID.
 *
 * @return Is Valid.
 */
export function isBlockValid( state: State, clientId: string ): boolean {
	const block = state.blocks.byClientId.get( clientId );
	return !! block && block.isValid;
}

/**
 * Returns a block's attributes given its client ID, or null if no block exists with
 * the client ID.
 *
 * @param  state    Editor state.
 * @param  clientId Block client ID.
 *
 * @return {?Object} Block attributes.
 */
export function getBlockAttributes( state: State, clientId: string ) {
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
 * @param state    Editor state.
 * @param clientId Block client ID.
 *
 * @return  Parsed block object.
 */
export function getBlock( state: State, clientId: string ): Block | null {
	if ( ! state.blocks.byClientId.has( clientId ) ) {
		return null;
	}

	return ( state.blocks.tree.get( clientId ) as unknown as Block ) ?? null;
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
 * @param  state        Editor state.
 * @param  rootClientId Optional root client ID of block list.
 *
 * @return {Object[]} Post blocks.
 */
export function getBlocks( state: State, rootClientId?: string ) {
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
 * @param state    Editor state.
 * @param clientId Client ID of the block to get.
 *
 * @return  Client IDs of the post blocks.
 */
export function __unstableGetClientIdWithClientIdsTree(
	state: State,
	clientId: string
) {
	deprecated(
		"wp.data.select( 'core/block-editor' ).__unstableGetClientIdWithClientIdsTree",
		{
			since: '6.3',
			version: '6.5',
		}
	);
	return getClientIdWithClientIdsTree( state, clientId );
}

/**
 * Returns the block tree represented in the block-editor store from the
 * given root, consisting of stripped down block objects containing only
 * their client IDs, and their inner blocks' client IDs.
 *
 * @deprecated
 *
 * @param  state        Editor state.
 * @param  rootClientId Optional root client ID of block list.
 *
 * @return {Object[]} Client IDs of the post blocks.
 */
export function __unstableGetClientIdsTree(
	state: State,
	rootClientId?: string
) {
	deprecated(
		"wp.data.select( 'core/block-editor' ).__unstableGetClientIdsTree",
		{
			since: '6.3',
			version: '6.5',
		}
	);
	return getClientIdsTree( state, rootClientId );
}

/**
 * Returns an array containing the clientIds of all descendants of the blocks
 * given. Returned ids are ordered first by the order of the ids given, then
 * by the order that they appear in the editor.
 *
 * @param                   state   Global application state.
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
 * @param  state Global application state.
 *
 * @return {Array} ids of top-level and descendant blocks.
 */
export const getClientIdsWithDescendants = ( state: State ) =>
	getClientIdsOfDescendants( state, '' );

/**
 * Returns the total number of blocks, or the total number of blocks with a specific name in a post.
 * The number returned includes nested blocks.
 *
 * @param  state     Global application state.
 * @param  blockName Optional block name, if specified only blocks of that type will be counted.
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
 * @param            state     Global application state.
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
 * @param  state     Global application state.
 * @param  blockName Block name(s) for which clientIds are to be returned.
 *
 * @return {Array} Array of clientIds of blocks with name equal to blockName.
 */
export function __experimentalGetGlobalBlocksByName(
	state: State,
	blockName: string | string[]
) {
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
 * @param            state     Editor state.
 * @param {string[]} clientIds Client IDs for which blocks are to be returned.
 *
 * @return  Block objects.
 */
export const getBlocksByClientId = createSelector(
	( state: State, clientIds: string[] ): ( Block | null )[] =>
		( Array.isArray( clientIds ) ? clientIds : [ clientIds ] ).map(
			( clientId ) => getBlock( state, clientId )
		),
	( state: State, clientIds: string[] ) =>
		( Array.isArray( clientIds ) ? clientIds : [ clientIds ] ).map(
			( clientId ) => state.blocks.tree.get( clientId )
		)
);

/**
 * Given an array of block client IDs, returns the corresponding array of block
 * names.
 *
 * @param            state     Editor state.
 * @param {string[]} clientIds Client IDs for which block names are to be returned.
 *
 * @return {string[]} Block names.
 */
export const getBlockNamesByClientId = createSelector(
	( state: State, clientIds: string[] ) =>
		getBlocksByClientId( state, clientIds )
			.filter( Boolean )
			.map( ( block ) => block!.name ),
	( state: State, clientIds: string[] ) =>
		getBlocksByClientId( state, clientIds )
);

/**
 * Returns the number of blocks currently present in the post.
 *
 * @param  state        Editor state.
 * @param  rootClientId Optional root client ID of block list.
 *
 * @return {number} Number of blocks in the post.
 */
export function getBlockCount( state: State, rootClientId?: string ) {
	return getBlockOrder( state, rootClientId ).length;
}

/**
 * Returns the current selection start block client ID, attribute key and text
 * offset.
 *
 * @param  state Block editor state.
 *
 * @return {WPBlockSelection} Selection start information.
 */
export function getSelectionStart( state: State ) {
	return state.selection.selectionStart;
}

/**
 * Returns the current selection end block client ID, attribute key and text
 * offset.
 *
 * @param  state Block editor state.
 *
 * @return {WPBlockSelection} Selection end information.
 */
export function getSelectionEnd( state: State ) {
	return state.selection.selectionEnd;
}

/**
 * Returns the current block selection start. This value may be null, and it
 * may represent either a singular block selection or multi-selection start.
 * A selection is singular if its start and end match.
 *
 * @param state Global application state.
 *
 * @return  Client ID of block selection start.
 */
export function getBlockSelectionStart( state: State ) {
	return state.selection.selectionStart.clientId;
}

/**
 * Returns the current block selection end. This value may be null, and it
 * may represent either a singular block selection or multi-selection end.
 * A selection is singular if its start and end match.
 *
 * @param state Global application state.
 *
 * @return  Client ID of block selection end.
 */
export function getBlockSelectionEnd( state: State ) {
	return state.selection.selectionEnd.clientId;
}

/**
 * Returns the number of blocks currently selected in the post.
 *
 * @param  state Global application state.
 *
 * @return {number} Number of blocks selected in the post.
 */
export function getSelectedBlockCount( state: State ) {
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
 * @param  state Editor state.
 *
 * @return {boolean} Whether a single block is selected.
 */
export function hasSelectedBlock( state: State ) {
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
 * @param state Editor state.
 *
 * @return  Selected block client ID.
 */
export function getSelectedBlockClientId( state: State ) {
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
 * @param  state Global application state.
 *
 * @example
 *
 *```js
 * import { select } from '@wordpress/data'
 * import { store as blockEditorStore } from '@wordpress/block-editor'
 *
 * // Set initial active block client ID
 * let activeBlockClientId = null
 *
 * const getActiveBlockData = () => {
 * 	const activeBlock = select(blockEditorStore).getSelectedBlock()
 *
 * 	if (activeBlock && activeBlock.clientId !== activeBlockClientId) {
 * 		activeBlockClientId = activeBlock.clientId
 *
 * 		// Get active block name and attributes
 * 		const activeBlockName = activeBlock.name
 * 		const activeBlockAttributes = activeBlock.attributes
 *
 * 		// Log active block name and attributes
 * 		console.log(activeBlockName, activeBlockAttributes)
 * 		}
 * 	}
 *
 * 	// Subscribe to changes in the editor
 * 	// wp.data.subscribe(() => {
 * 		// getActiveBlockData()
 * 	// })
 *
 * 	// Update active block data on click
 * 	// onclick="getActiveBlockData()"
 *```
 *
 * @return {?Object} Selected block.
 */
export function getSelectedBlock( state: State ) {
	const clientId = getSelectedBlockClientId( state );
	return clientId ? getBlock( state, clientId ) : null;
}

/**
 * Given a block client ID, returns the root block from which the block is
 * nested, an empty string for top-level blocks, or null if the block does not
 * exist.
 *
 * @param state    Editor state.
 * @param clientId Block from which to find root client ID.
 *
 * @return  Root client ID, if exists
 */
export function getBlockRootClientId( state: State, clientId: string ) {
	return state.blocks.parents.get( clientId ) ?? null;
}

/**
 * Given a block client ID, returns the list of all its parents from top to bottom.
 *
 * @param           state     Editor state.
 * @param           clientId  Block from which to find root client ID.
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
 * @param           state     Editor state.
 * @param           clientId  Block from which to find root client ID.
 * @param           blockName Block name(s) to filter.
 * @param {boolean} ascending Order results from bottom to top (true) or top to bottom (false).
 *
 * @return {Array} ClientIDs of the parent blocks.
 */
export const getBlockParentsByBlockName = createSelector(
	(
		state: State,
		clientId: string,
		blockName: string | string[],
		ascending = false
	) => {
		const parents = getBlockParents( state, clientId, ascending );
		const hasName = Array.isArray( blockName )
			? ( name: string ) => blockName.includes( name )
			: ( name: string ) => blockName === name;
		return parents.filter( ( id ) => {
			const name = getBlockName( state, id );
			return name !== null && hasName( name );
		} );
	},
	( state ) => [ state.blocks.parents ]
);
/**
 * Given a block client ID, returns the root of the hierarchy from which the block is nested, return the block itself for root level blocks.
 *
 * @param state    Editor state.
 * @param clientId Block from which to find root client ID.
 *
 * @return  Root client ID
 */
export function getBlockHierarchyRootClientId(
	state: State,
	clientId: string
) {
	let current: string | undefined = clientId;
	let parent: string | undefined;
	do {
		parent = current!;
		current = state.blocks.parents.get( current! );
	} while ( current );
	return parent!;
}

/**
 * Given a block client ID, returns the lowest common ancestor with selected client ID.
 *
 * @param state    Editor state.
 * @param clientId Block from which to find common ancestor client ID.
 *
 * @return  Common ancestor client ID or undefined
 */
export function getLowestCommonAncestorWithSelectedBlock(
	state: State,
	clientId: string
) {
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
 * @param state         Editor state.
 * @param startClientId Optional client ID of block from which to
 *                      search.
 * @param modifier      Directionality multiplier (1 next, -1
 *                      previous).
 *
 * @return  Return the client ID of the block, or null if none exists.
 */
export function getAdjacentBlockClientId(
	state: State,
	startClientId?: string,
	modifier = 1
) {
	// Default to selected block.
	if ( startClientId === undefined ) {
		startClientId = getSelectedBlockClientId( state ) ?? undefined;
	}

	// Try multi-selection starting at extent based on modifier.
	if ( startClientId === undefined ) {
		if ( modifier < 0 ) {
			startClientId =
				getFirstMultiSelectedBlockClientId( state ) ?? undefined;
		} else {
			startClientId =
				getLastMultiSelectedBlockClientId( state ) ?? undefined;
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
	if ( ! orderSet ) {
		return null;
	}
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
 * @param state         Editor state.
 * @param startClientId Optional client ID of block from which to
 *                      search.
 *
 * @return  Adjacent block's client ID, or null if none exists.
 */
export function getPreviousBlockClientId(
	state: State,
	startClientId?: string
) {
	return getAdjacentBlockClientId( state, startClientId, -1 );
}

/**
 * Returns the next block's client ID from the given reference start ID.
 * Defaults start to the selected block. Returns null if there is no next
 * block.
 *
 * @param state         Editor state.
 * @param startClientId Optional client ID of block from which to
 *                      search.
 *
 * @return  Adjacent block's client ID, or null if none exists.
 */
export function getNextBlockClientId( state: State, startClientId?: string ) {
	return getAdjacentBlockClientId( state, startClientId, 1 );
}

/**
 * Returns the initial caret position for the selected block.
 * This position is to used to position the caret properly when the selected block changes.
 * If the current block is not a RichText, having initial position set to 0 means "focus block"
 *
 * @param  state Global application state.
 *
 * @return {0|-1|null} Initial position.
 */
export function getSelectedBlocksInitialCaretPosition( state: State ) {
	return state.initialPosition;
}

/**
 * Returns the current selection set of block client IDs (multiselection or single selection).
 *
 * @param state Editor state.
 *
 * @return Multi-selected block client IDs.
 */
export const getSelectedBlockClientIds = createSelector(
	( state: State ): string[] => {
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
	( state: State ) => [
		state.blocks.order,
		state.selection.selectionStart.clientId,
		state.selection.selectionEnd.clientId,
	]
);

/**
 * Returns the current multi-selection set of block client IDs, or an empty
 * array if there is no multi-selection.
 *
 * @param state Editor state.
 *
 * @return Multi-selected block client IDs.
 */
export function getMultiSelectedBlockClientIds( state: State ) {
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
 * @param state Editor state.
 *
 * @return Multi-selected block objects.
 */
export const getMultiSelectedBlocks = createSelector(
	( state: State ) => {
		const multiSelectedBlockClientIds: string[] =
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
 * @param state Editor state.
 *
 * @return First block client ID in the multi-selection set, or null if there is no multi-selection.
 */
export function getFirstMultiSelectedBlockClientId( state: State ) {
	return getMultiSelectedBlockClientIds( state )[ 0 ] || null;
}

/**
 * Returns the client ID of the last block in the multi-selection set, or null
 * if there is no multi-selection.
 *
 * @param state Editor state.
 *
 * @return Last block client ID in the multi-selection set, or null if there is no multi-selection.
 */
export function getLastMultiSelectedBlockClientId( state: State ) {
	const selectedClientIds = getMultiSelectedBlockClientIds( state );
	return selectedClientIds[ selectedClientIds.length - 1 ] || null;
}

/**
 * Returns true if a multi-selection exists, and the block corresponding to the
 * specified client ID is the first block of the multi-selection set, or false
 * otherwise.
 *
 * @param state    Editor state.
 * @param clientId Block client ID.
 *
 * @return Whether block is first in multi-selection.
 */
export function isFirstMultiSelectedBlock( state: State, clientId: string ) {
	return getFirstMultiSelectedBlockClientId( state ) === clientId;
}

/**
 * Returns true if the client ID occurs within the block multi-selection, or
 * false otherwise.
 *
 * @param state    Editor state.
 * @param clientId Block client ID.
 *
 * @return Whether block is in multi-selection set.
 */
export function isBlockMultiSelected( state: State, clientId: string ) {
	return getMultiSelectedBlockClientIds( state ).indexOf( clientId ) !== -1;
}

/**
 * Returns true if an ancestor of the block is multi-selected, or false
 * otherwise.
 *
 * @param state    Editor state.
 * @param clientId Block client ID.
 *
 * @return Whether an ancestor of the block is in multi-selection set.
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
 * @param state Editor state.
 *
 * @return Client ID of block beginning multi-selection, or null if there is no multi-selection.
 */
export function getMultiSelectedBlocksStartClientId( state: State ) {
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
 * @param state Editor state.
 *
 * @return Client ID of block ending multi-selection, or null if there is no multi-selection.
 */
export function getMultiSelectedBlocksEndClientId( state: State ) {
	const { selectionStart, selectionEnd } = state.selection;

	if ( selectionStart.clientId === selectionEnd.clientId ) {
		return null;
	}

	return selectionEnd.clientId || null;
}

/**
 * Returns true if the selection is not partial.
 *
 * @param state Editor state.
 * @return Whether the selection is mergeable.
 */
export function __unstableIsFullySelected( state: State ) {
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
 * @param state Editor state.
 * @return Whether the selection is collapsed.
 */
export function __unstableIsSelectionCollapsed( state: State ) {
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

export function __unstableSelectionHasUnmergeableBlock( state: State ) {
	return getSelectedBlockClientIds( state ).some( ( clientId ) => {
		const blockName = getBlockName( state, clientId );
		if ( ! blockName ) {
			return false;
		}
		const blockType = getBlockType( blockName );
		if ( ! blockType ) {
			return false;
		}
		return ! blockType.merge;
	} );
}

/**
 * Check whether the selection is mergeable.
 *
 * @param state     Editor state.
 * @param isForward Whether to merge forwards.
 * @return Whether the selection is mergeable.
 */
export function __unstableIsSelectionMergeable(
	state: State,
	isForward: boolean
): boolean {
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
		selectionAnchor.clientId!
	);
	const focusRootClientId = getBlockRootClientId(
		state,
		selectionFocus.clientId!
	);

	// It's not mergeable if the selection doesn't start and end in the same
	// block list. Maybe in the future it should be allowed.
	if ( anchorRootClientId !== focusRootClientId ) {
		return false;
	}

	const blockOrder = getBlockOrder( state, anchorRootClientId ?? undefined );
	const anchorIndex = blockOrder.indexOf( selectionAnchor.clientId! );
	const focusIndex = blockOrder.indexOf( selectionFocus.clientId! );

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
	if ( ! targetBlockName ) {
		return false;
	}

	const targetBlockType = getBlockType( targetBlockName );
	if ( ! targetBlockType?.merge ) {
		return false;
	}

	const blockToMerge = getBlock( state, blockToMergeClientId! );
	if ( ! blockToMerge ) {
		return false;
	}

	// It's mergeable if the blocks are of the same type.
	if ( blockToMerge.name === targetBlockName ) {
		return true;
	}

	// If the blocks are of a different type, try to transform the block being
	// merged into the same type of block.
	const blocksToMerge = switchToBlockType(
		blockToMerge as unknown as Block,
		targetBlockName
	);

	return !! ( blocksToMerge && blocksToMerge.length );
}

/**
 * Get partial selected blocks with their content updated
 * based on the selection.
 *
 * @param  state Editor state.
 *
 * @return {Object[]} Updated partial selected blocks.
 */
export const __unstableGetSelectedBlocksWithPartialSelection = (
	state: State
) => {
	const selectionAnchor = getSelectionStart( state );
	const selectionFocus = getSelectionEnd( state );

	if ( ! selectionAnchor.clientId || ! selectionFocus.clientId ) {
		return EMPTY_ARRAY;
	}

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

	const blockOrder = getBlockOrder( state, anchorRootClientId ?? undefined );
	const anchorIndex = blockOrder.indexOf( selectionAnchor.clientId );
	const focusIndex = blockOrder.indexOf( selectionFocus.clientId );

	// Reassign selection start and end based on order.
	const [ selectionStart, selectionEnd ] =
		anchorIndex > focusIndex
			? [ selectionFocus, selectionAnchor ]
			: [ selectionAnchor, selectionFocus ];

	const blockA = getBlock( state, selectionStart.clientId! );
	const blockB = getBlock( state, selectionEnd.clientId! );

	if ( ! blockA || ! blockB ) {
		return EMPTY_ARRAY;
	}

	const htmlA = blockA.attributes[ selectionStart.attributeKey! ];
	const htmlB = blockB.attributes[ selectionEnd.attributeKey! ];

	let valueA = create( { html: htmlA as string } );
	let valueB = create( { html: htmlB as string } );

	valueA = remove( valueA, 0, selectionStart.offset );
	valueB = remove( valueB, selectionEnd.offset, valueB.text.length );

	return [
		{
			...blockA,
			attributes: {
				...blockA.attributes,
				[ selectionStart.attributeKey! ]: toHTMLString( {
					value: valueA,
				} ),
			},
		},
		{
			...blockB,
			attributes: {
				...blockB.attributes,
				[ selectionEnd.attributeKey! ]: toHTMLString( {
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
 * @param  state        Editor state.
 * @param  rootClientId Optional root client ID of block list.
 *
 * @return {Array} Ordered client IDs of editor blocks.
 */
export function getBlockOrder( state: State, rootClientId?: string ) {
	return state.blocks.order.get( rootClientId || '' ) || EMPTY_ARRAY;
}

/**
 * Returns the index at which the block corresponding to the specified client
 * ID occurs within the block order, or `-1` if the block does not exist.
 *
 * @param  state    Editor state.
 * @param  clientId Block client ID.
 *
 * @return {number} Index at which block exists in order.
 */
export function getBlockIndex( state: State, clientId: string ) {
	const rootClientId = getBlockRootClientId( state, clientId );
	return getBlockOrder( state, rootClientId ?? undefined ).indexOf(
		clientId
	);
}

/**
 * Returns true if the block corresponding to the specified client ID is
 * currently selected and no multi-selection exists, or false otherwise.
 *
 * @param state    Editor state.
 * @param clientId Block client ID.
 *
 * @return  Whether block is selected and multi-selection exists.
 */
export function isBlockSelected( state: State, clientId: string ): boolean {
	const { selectionStart, selectionEnd } = state.selection;

	if ( selectionStart.clientId !== selectionEnd.clientId ) {
		return false;
	}

	return selectionStart.clientId === clientId;
}

/**
 * Returns true if one of the block's inner blocks is selected.
 *
 * @param state    Editor state.
 * @param clientId Block client ID.
 * @param deep     Perform a deep check.
 *
 * @return  Whether the block has an inner block selected
 */
export function hasSelectedInnerBlock(
	state: State,
	clientId: string,
	deep: boolean = false
): boolean {
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
 * @param           state    Editor state.
 * @param           clientId Block client ID.
 * @param {boolean} deep     Perform a deep check.
 *
 * @return {boolean} Whether the block has an inner block dragged
 */
export function hasDraggedInnerBlock(
	state: State,
	clientId: string,
	deep: boolean = false
): boolean {
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
 * @param  state    Editor state.
 * @param  clientId Block client ID.
 *
 * @return {boolean} Whether block is selected and not the last in the
 *                   selection.
 */
export function isBlockWithinSelection(
	state: State,
	clientId: string
): boolean {
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
 * @param  state Editor state.
 *
 * @return {boolean} Whether multi-selection has been made.
 */
export function hasMultiSelection( state: State ): boolean {
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
 * @param  state Global application state.
 *
 * @return {boolean} True if multi-selecting, false if not.
 */
export function isMultiSelecting( state: State ): boolean {
	return state.isMultiSelecting;
}

/**
 * Selector that returns if multi-selection is enabled or not.
 *
 * @param  state Global application state.
 *
 * @return {boolean} True if it should be possible to multi-select blocks, false if multi-selection is disabled.
 */
export function isSelectionEnabled( state: State ): boolean {
	return state.isSelectionEnabled;
}

/**
 * Returns the block's editing mode, defaulting to "visual" if not explicitly
 * assigned.
 *
 * @param state    Editor state.
 * @param clientId Block client ID.
 *
 * @return  Block editing mode.
 */
export function getBlockMode( state: State, clientId: string ): string {
	return state.blocksMode[ clientId ] || 'visual';
}

/**
 * Returns true if the user is typing, or false otherwise.
 *
 * @param  state Global application state.
 *
 * @return {boolean} Whether user is typing.
 */
export function isTyping( state: State ): boolean {
	return state.isTyping;
}

/**
 * Returns true if the user is dragging blocks, or false otherwise.
 *
 * @param  state Global application state.
 *
 * @return {boolean} Whether user is dragging blocks.
 */
export function isDraggingBlocks( state: State ): boolean {
	return !! state.draggedBlocks.length;
}

/**
 * Returns the client ids of any blocks being directly dragged.
 *
 * This does not include children of a parent being dragged.
 *
 * @param  state Global application state.
 *
 * @return {string[]} Array of dragged block client ids.
 */
export function getDraggedBlockClientIds( state: State ): string[] {
	return state.draggedBlocks;
}

/**
 * Returns whether the block is being dragged.
 *
 * Only returns true if the block is being directly dragged,
 * not if the block is a child of a parent being dragged.
 * See `isAncestorBeingDragged` for child blocks.
 *
 * @param  state    Global application state.
 * @param  clientId Client id for block to check.
 *
 * @return {boolean} Whether the block is being dragged.
 */
export function isBlockBeingDragged( state: State, clientId: string ): boolean {
	return state.draggedBlocks.includes( clientId );
}

/**
 * Returns whether a parent/ancestor of the block is being dragged.
 *
 * @param  state    Global application state.
 * @param  clientId Client id for block to check.
 *
 * @return {boolean} Whether the block's ancestor is being dragged.
 */
export function isAncestorBeingDragged(
	state: State,
	clientId: string
): boolean {
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
 * @return Whether the caret is within formatted text.
 */
export function isCaretWithinFormattedText(): boolean {
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
 * @param state Editor state.
 *
 * @return Insertion point object with `rootClientId`, `index`.
 */
export const getBlockInsertionPoint = createSelector(
	( state: State ) => {
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
			index = getBlockIndex( state, clientId ) + 1;
		} else {
			index = getBlockOrder( state ).length;
		}

		return { rootClientId, index };
	},
	( state: State ) => [
		state.insertionCue,
		state.selection.selectionEnd.clientId,
		state.blocks.parents,
		state.blocks.order,
	]
);

/**
 * Returns true if the block insertion point is visible.
 *
 * @param state Global application state.
 *
 * @return Whether the insertion point is visible or not.
 */
export function isBlockInsertionPointVisible( state: State ): boolean {
	return state.insertionCue !== null;
}

/**
 * Returns whether the blocks matches the template or not.
 *
 * @param state
 * @return Whether the template is valid or not.
 */
export function isValidTemplate( state: State ): boolean {
	return state.template?.isValid ?? true;
}

/**
 * Returns the defined block template
 *
 * @param state
 *
 * @return Block Template.
 */
export function getTemplate( state: State ): TemplateState | null {
	return ( state.settings?.template as TemplateState | null ) ?? null;
}

/**
 * Returns the defined block template lock. Optionally accepts a root block
 * client ID as context, otherwise defaulting to the global context.
 *
 * @param state        Editor state.
 * @param rootClientId Optional block root client ID.
 *
 * @return Block Template Lock
 */
export function getTemplateLock( state: State, rootClientId?: string ) {
	if ( ! rootClientId ) {
		return state.settings.templateLock ?? false;
	}

	const blockListTemplateLock = getBlockListSettings( state, rootClientId )
		?.templateLock;

	// If this is a contentOnly template locked block that's in the process
	// of being edited, consider the template lock as temporarily inactive.
	if (
		blockListTemplateLock === 'contentOnly' &&
		state.editedContentOnlySection === rootClientId
	) {
		return false;
	}

	return blockListTemplateLock ?? false;
}

/**
 * Determines if the given block type is visible in the inserter.
 * Note that this is different than whether a block is allowed to be inserted.
 * In some cases, the block is not allowed in a given position but
 * it should still be visible in the inserter to be able to add it
 * to a different position.
 *
 * @param state           Editor state.
 * @param blockNameOrType The block type object, e.g., the response
 *                        from the block directory; or a string name of
 *                        an installed block type, e.g.' core/paragraph'.
 * @param rootClientId    Optional root client ID of block list.
 *
 * @return Whether the given block type is allowed to be inserted.
 */
const isBlockVisibleInTheInserter = (
	state: State,
	blockNameOrType: string,
	rootClientId: string | null = null
): boolean => {
	let blockType;
	let blockName;

	if ( blockNameOrType && 'object' === typeof blockNameOrType ) {
		blockType = blockNameOrType as BlockType;
		blockName = ( blockNameOrType as BlockType ).name;
	} else {
		blockType = getBlockType( blockNameOrType );
		blockName = blockNameOrType;
	}

	if ( ! blockType ) {
		return false;
	}

	const { allowedBlockTypes } = getSettings( state );

	const isBlockAllowedInEditor = checkAllowList(
		allowedBlockTypes as string[],
		blockName,
		true
	);
	if ( ! isBlockAllowedInEditor ) {
		return false;
	}

	// If parent blocks are not visible, child blocks should be hidden too.
	const parents = (
		Array.isArray( blockType.parent ) ? blockType.parent : []
	).concat( Array.isArray( blockType.ancestor ) ? blockType.ancestor : [] );
	if ( parents.length > 0 ) {
		// This is an exception to the rule that says that all blocks are visible in the inserter.
		// Blocks that require a given parent or ancestor are only visible if we're within that parent.
		if ( parents.includes( 'core/post-content' ) ) {
			return true;
		}

		let current = rootClientId;
		let hasParent = false;
		do {
			if (
				parents.includes(
					getBlockName( state, current ?? undefined ) ?? ''
				)
			) {
				hasParent = true;
				break;
			}
			current = state.blocks.parents.get( current ?? '' ) ?? null;
		} while ( current );

		return hasParent;
	}

	return true;
};

/**
 * Determines if the given block type is allowed to be inserted into the block list.
 * This function is not exported and not memoized because using a memoized selector
 * inside another memoized selector is just a waste of time.
 *
 * @param state        Editor state.
 * @param blockName    The block type object, e.g., the response
 *                     from the block directory; or a string name of
 *                     an installed block type, e.g.' core/paragraph'.
 * @param rootClientId Optional root client ID of block list.
 *
 * @return Whether the given block type is allowed to be inserted.
 */
const canInsertBlockTypeUnmemoized = (
	state: State,
	blockName: string,
	rootClientId: string | null = null
): unknown => {
	// Disable insertion in preview mode.
	if ( state.settings.isPreviewMode ) {
		return false;
	}

	if ( ! isBlockVisibleInTheInserter( state, blockName, rootClientId ) ) {
		return false;
	}

	let blockType: BlockType | undefined;
	if ( blockName && 'object' === typeof blockName ) {
		blockType = blockName as unknown as BlockType;
		blockName = blockType.name;
	} else {
		blockType = getBlockType( blockName );
	}

	const rootTemplateLock = getTemplateLock(
		state,
		rootClientId ?? undefined
	);
	if ( rootTemplateLock && rootTemplateLock !== 'contentOnly' ) {
		return false;
	}

	// No insertion within static inner content: the inner blocks are fixed
	// at their placeholder positions within the static markup.
	if ( isInnerContentRoot( state, rootClientId ) ) {
		return false;
	}

	const blockEditingMode = getBlockEditingMode( state, rootClientId ?? '' );

	// Compute section context early so the disabled check below can use it.
	const isParentSectionBlock = !! isSectionBlock( state, rootClientId ?? '' );
	const sectionClientId = isParentSectionBlock
		? rootClientId
		: getParentSectionBlock( state, rootClientId ?? '' );
	const isWithinSection = !! sectionClientId;

	// Disabled containers reject all blocks, with one exception: within a
	// section, the default block (paragraph) is allowed through so it can
	// reach the content-insertion logic further down (lines 1748-1772)
	// which conditionally permits it where a sibling paragraph exists.
	if (
		blockEditingMode === 'disabled' &&
		( ! isWithinSection || blockName !== getDefaultBlockName() )
	) {
		return false;
	}

	const parentBlockListSettings = getBlockListSettings(
		state,
		rootClientId ?? ''
	);

	// The parent block doesn't have settings indicating it doesn't support
	// inner blocks, return false.
	if ( rootClientId && parentBlockListSettings === undefined ) {
		return false;
	}

	// It shouldn't be possible to insert inside a section block unless in
	// some cases when the block is a content block.
	const isContentRoleBlock = isContentBlock( blockName );
	if ( isWithinSection && ! isContentRoleBlock ) {
		return false;
	}

	// Don't allow insertion into synced patterns.
	if (
		isWithinSection &&
		getBlockName( state, sectionClientId ) === 'core/block'
	) {
		return false;
	}

	/*
	 * In content only mode, check if this container allows insertion.
	 * We need the `isParentSectionBlock` check because section blocks
	 * (synced patterns, contentOnly groups) have a `getBlockEditingMode`
	 * of 'default', not 'contentOnly' — the 'contentOnly' mode is only
	 * set on their *children*.
	 *
	 * Also include `disabled` alongside `contentOnly`: structural inner blocks
	 * (e.g. Column) inside a content-only section use `disabled` mode, and they
	 * need the same default-block sibling rules so insertion stays aligned with
	 * `canRemoveBlock`.
	 */
	if (
		isWithinSection &&
		( isParentSectionBlock ||
			blockEditingMode === 'contentOnly' ||
			blockEditingMode === 'disabled' ) &&
		! isContainerInsertableToInContentOnlyMode(
			state,
			blockName,
			rootClientId ?? ''
		)
	) {
		const defaultBlockName = getDefaultBlockName();
		/*
		 * Allow inserting the default block anywhere that another default block already exists
		 * when in contentOnly mode. The same sibling rule applies when the parent is `disabled`
		 * within a content-only section (see the condition above).
		 */
		if ( blockName === defaultBlockName ) {
			const existingBlocks = getBlockOrder( state, rootClientId ?? '' );
			const hasDefaultBlock = existingBlocks.some(
				( clientId ) =>
					getBlockName( state, clientId ) === defaultBlockName
			);
			if ( ! hasDefaultBlock ) {
				return false;
			}
		} else {
			return false;
		}
	}

	const parentName = getBlockName( state, rootClientId ?? undefined );

	if ( ! parentName ) {
		return false;
	}

	const parentBlockType = getBlockType( parentName );

	// Look at the `blockType.allowedBlocks` field to determine whether this is an allowed child block.
	const parentAllowedChildBlocks = parentBlockType?.allowedBlocks;

	let hasParentAllowedBlock = checkAllowList(
		parentAllowedChildBlocks as unknown as string[],
		blockName
	);

	// The `allowedBlocks` block list setting can further limit which blocks are allowed children.
	if ( hasParentAllowedBlock !== false ) {
		const parentAllowedBlocks = parentBlockListSettings?.allowedBlocks;
		const hasParentListAllowedBlock = checkAllowList(
			parentAllowedBlocks as unknown as string[],
			blockName
		);
		// Never downgrade the result from `true` to `null`
		if ( hasParentListAllowedBlock !== null ) {
			hasParentAllowedBlock = hasParentListAllowedBlock;
		}
	}

	if ( ! blockType ) {
		return false;
	}

	const blockAllowedParentBlocks = blockType.parent;
	const hasBlockAllowedParent = checkAllowList(
		blockAllowedParentBlocks ?? [],
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
 * @param state        Editor state.
 * @param blockName    The name of the block type, e.g.' core/paragraph'.
 * @param rootClientId Optional root client ID of block list.
 *
 * @return  Whether the given block type is allowed to be inserted.
 */
export const canInsertBlockType = createSelector(
	canInsertBlockTypeUnmemoized,
	( state: State, _blockName: string, rootClientId: string | undefined ) =>
		getInsertBlockTypeDependants()( state, rootClientId )
);

/**
 * Determines if the given blocks are allowed to be inserted into the block
 * list.
 *
 * @param state        Editor state.
 * @param clientIds    The block client IDs to be inserted.
 * @param rootClientId Optional root client ID of block list.
 *
 * @return  Whether the given blocks are allowed to be inserted.
 */
export function canInsertBlocks(
	state: State,
	clientIds: string[],
	rootClientId: string | undefined = undefined
): boolean {
	return clientIds.every( ( id ) => {
		const blockName = getBlockName( state, id );
		if ( ! blockName ) {
			return false;
		}
		return canInsertBlockType( state, blockName, rootClientId );
	} );
}

/**
 * Returns whether the given root block keeps its markup as static inner
 * content (the Custom HTML block). Its inner blocks are fixed at their
 * positions within the static markup: they can be edited in place, but not
 * moved or removed, and no blocks can be inserted alongside them. This only
 * applies to the direct children; deeper descendants are unaffected.
 *
 * @param state        Editor state.
 * @param rootClientId Root block client ID.
 *
 * @return Whether the root block uses static inner content.
 */
function isInnerContentRoot(
	state: State,
	rootClientId: string | null
): boolean {
	return (
		!! rootClientId && getBlockName( state, rootClientId ) === 'core/html'
	);
}

/**
 * Determines if the given block is allowed to be deleted.
 *
 * @param state    Editor state.
 * @param clientId The block client Id.
 *
 * @return  Whether the given block is allowed to be removed.
 */
export function canRemoveBlock(
	state: State,
	clientId: string | null
): boolean {
	// Disable removal in preview mode.
	if ( state.settings.isPreviewMode || ! clientId ) {
		return false;
	}

	// Blocks within static inner content are fixed in place; a `lock`
	// attribute can't override the structural constraint.
	if (
		isInnerContentRoot( state, getBlockRootClientId( state, clientId ) )
	) {
		return false;
	}

	const attributes = getBlockAttributes( state, clientId ) as BlockAttributes;
	if ( attributes === null ) {
		return true;
	}
	if ( attributes.lock?.remove !== undefined ) {
		return ! attributes.lock.remove;
	}

	const rootClientId = getBlockRootClientId( state, clientId );
	const rootTemplateLock = getTemplateLock(
		state,
		rootClientId ?? undefined
	);
	if ( rootTemplateLock && rootTemplateLock !== 'contentOnly' ) {
		return false;
	}

	// It shouldn't be possible to move in a section block unless in
	// some cases when the block is a content block.
	const isParentSectionBlock = !! isSectionBlock( state, rootClientId ?? '' );
	const sectionClientId = isParentSectionBlock
		? rootClientId
		: getParentSectionBlock( state, rootClientId ?? '' );
	const isWithinSection = !! sectionClientId;
	const isContentRoleBlock = isContentBlock(
		getBlockName( state, clientId )
	);
	if ( isWithinSection && ! isContentRoleBlock ) {
		return false;
	}

	// Disallow removal from synced patterns.
	if (
		isWithinSection &&
		getBlockName( state, sectionClientId ) === 'core/block'
	) {
		return false;
	}

	const rootBlockEditingMode = getBlockEditingMode(
		state,
		rootClientId ?? undefined
	);
	const blockName = getBlockName( state, clientId );
	const defaultBlockName = getDefaultBlockName();

	// Check if the parent container allows insertion/removal in contentOnly
	// mode. We need the `isParentSectionBlock` check because section blocks
	// (synced patterns, contentOnly groups) have a `getBlockEditingMode` of
	// 'default', not 'contentOnly' — the 'contentOnly' mode is only set on
	// their *children*.
	if (
		isWithinSection &&
		( isParentSectionBlock ||
			blockName === defaultBlockName ||
			rootBlockEditingMode === 'contentOnly' ) &&
		! isContainerInsertableToInContentOnlyMode(
			state,
			getBlockName( state, clientId ),
			rootClientId
		)
	) {
		// Allow removing the default block when other default blocks exist
		// in contentOnly mode.
		if ( blockName === defaultBlockName ) {
			const existingBlocks = getBlockOrder(
				state,
				rootClientId ?? undefined
			);
			const defaultBlocks = existingBlocks.filter(
				( id ) => getBlockName( state, id ) === defaultBlockName
			);
			// Allow removal if there are other default blocks besides this one
			if ( defaultBlocks.length > 1 ) {
				return true;
			}
			return false;
		}
		return false;
	}

	return rootBlockEditingMode !== 'disabled';
}

/**
 * Determines if the given blocks are allowed to be removed.
 *
 * @param state     Editor state.
 * @param clientIds The block client IDs to be removed.
 *
 * @return Whether the given blocks are allowed to be removed.
 */
export function canRemoveBlocks( state: State, clientIds: string[] ): boolean {
	return clientIds.every( ( clientId ) => canRemoveBlock( state, clientId ) );
}

/**
 * Determines if the given block is allowed to be moved.
 *
 * @param state    Editor state.
 * @param clientId The block client Id.
 *
 * @return Whether the given block is allowed to be moved.
 */
export function canMoveBlock( state: State, clientId: string ): boolean {
	// Disable moving in preview mode.
	if ( state.settings.isPreviewMode ) {
		return false;
	}

	// Blocks within static inner content are fixed in place; a `lock`
	// attribute can't override the structural constraint.
	if (
		isInnerContentRoot( state, getBlockRootClientId( state, clientId ) )
	) {
		return false;
	}

	const attributes = getBlockAttributes( state, clientId ) as BlockAttributes;
	if ( attributes === null ) {
		return true;
	}
	if ( attributes.lock?.move !== undefined ) {
		return ! attributes.lock.move;
	}

	const rootClientId = getBlockRootClientId( state, clientId );
	const rootTemplateLock = getTemplateLock(
		state,
		rootClientId ?? undefined
	);
	if ( rootTemplateLock === 'all' ) {
		return false;
	}

	const isBlockWithinSection = !! getParentSectionBlock( state, clientId );
	const isContentRoleBlock = isContentBlock(
		getBlockName( state, clientId )
	);
	if ( isBlockWithinSection && ! isContentRoleBlock ) {
		return false;
	}

	// If the block is within a section and the parent is either a section
	// block itself or has contentOnly editing mode, check whether the inner
	// block should be allowed to move. We need the `isParentSectionBlock`
	// check because section blocks (synced patterns, contentOnly groups)
	// have a `getBlockEditingMode` of 'default', not 'contentOnly' — the
	// 'contentOnly' mode is only set on their *children*.
	const isParentSectionBlock = !! isSectionBlock(
		state,
		rootClientId as string
	);
	const rootBlockEditingMode = getBlockEditingMode(
		state,
		rootClientId ?? undefined
	);
	if (
		isBlockWithinSection &&
		( isParentSectionBlock || rootBlockEditingMode === 'contentOnly' ) &&
		! isContainerInsertableToInContentOnlyMode(
			state,
			getBlockName( state, clientId ) ?? '',
			rootClientId ?? ''
		)
	) {
		return false;
	}

	return (
		getBlockEditingMode( state, rootClientId ?? undefined ) !== 'disabled'
	);
}

/**
 * Determines if the given blocks are allowed to be moved.
 *
 * @param  state     Editor state.
 * @param  clientIds The block client IDs to be moved.
 *
 * @return {boolean} Whether the given blocks are allowed to be moved.
 */
export function canMoveBlocks( state: State, clientIds: string[] ) {
	return clientIds.every( ( clientId ) => canMoveBlock( state, clientId ) );
}

/**
 * Determines if the given block is allowed to be edited.
 *
 * @param state    Editor state.
 * @param clientId The block client Id.
 *
 * @return Whether the given block is allowed to be edited.
 */
export function canEditBlock( state: State, clientId: string ): boolean {
	// Disable editing in preview mode.
	if ( state.settings.isPreviewMode ) {
		return false;
	}

	const attributes = getBlockAttributes( state, clientId ) as BlockAttributes;
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
 * @param state      Editor state.
 * @param nameOrType Block name or type object.
 *
 * @return Whether a given block type can be locked/unlocked.
 */
export function canLockBlockType( state: State, nameOrType: string ): boolean {
	// Disable locking in preview mode.
	if ( state.settings.isPreviewMode ) {
		return false;
	}

	if ( ! hasBlockSupport( nameOrType, 'lock', true ) ) {
		return false;
	}

	// Use block editor settings as the default value.
	return !! state.settings?.canLockBlocks;
}

/**
 * Returns information about how recently and frequently a block has been inserted.
 *
 * @param state Global application state.
 * @param id    A string which identifies the insert, e.g. 'core/block/12'
 *
 * @return  An object containing `time` which is when the last
 *                                            insert occurred as a UNIX epoch, and `count` which is
 *                                            the number of inserts that have occurred.
 */
function getInsertUsage(
	state: State,
	id: string
): {
	time: number;
	count: number;
} | null {
	return state.preferences.insertUsage?.[ id ] ?? null;
}

/**
 * Returns whether we can show a block type in the inserter
 *
 * @param state        Global State
 * @param blockType    BlockType
 * @param rootClientId Optional root client ID of block list.
 *
 * @return Whether the given block type is allowed to be shown in the inserter.
 */
const canIncludeBlockTypeInInserter = (
	state: State,
	blockType: BlockType,
	rootClientId?: string
): unknown => {
	if ( ! hasBlockSupport( blockType, 'inserter', true ) ) {
		return false;
	}

	return canInsertBlockTypeUnmemoized(
		state,
		blockType.name,
		rootClientId as string
	);
};

/**
 * Return a function to be used to transform a block variation to an inserter item
 *
 * @param  state Global State
 * @param  item  Denormalized inserter item
 * @return {Function} Function to transform a block variation to inserter item
 */
const getItemFromVariation =
	( state: State, item: WPEditorInserterItem ) =>
	( variation: BlockVariation ) => {
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
			innerContent: variation.innerContent,
			keywords: variation.keywords || item.keywords,
			frecency: calculateFrecency( time as number, count ),
			// Pass through search-only flag for block-scope variations.
			isSearchOnly: variation.isSearchOnly,
		};
	};

/**
 * Returns the calculated frecency.
 *
 * 'frecency' is a heuristic (https://en.wikipedia.org/wiki/Frecency)
 * that combines block usage frequency and recency.
 *
 * @param time  When the last insert occurred as a UNIX epoch
 * @param count The number of inserts that have occurred.
 *
 * @return  The calculated frecency.
 */
const calculateFrecency = ( time: number, count: number ): number => {
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
 * block Transforms list.
 *
 * @param  state              Editor state.
 * @param  options            Options object for handling the building of a block type.
 * @param  options.buildScope The scope for which the item is going to be used.
 * @return {Function} Function returns an item to be shown in a specific context (Inserter|Transforms list).
 */
const buildBlockTypeItem =
	( state: State, { buildScope = 'inserter' } ) =>
	( blockType: BlockType ): WPEditorInserterItem | WPEditorTransformItem => {
		const id = blockType.name;

		let isDisabled = false;
		if ( ! hasBlockSupport( blockType.name, 'multiple', true ) ) {
			isDisabled = getBlocksByClientId(
				state,
				getClientIdsWithDescendants( state )
			).some( ( block ) => block?.name === blockType.name );
		}

		const { time, count = 0 } = getInsertUsage( state, id ) || {};

		const blockItemBase: WPEditorTransformItem = {
			id,
			name: blockType.name,
			title: blockType.title,
			icon: blockType.icon,
			isDisabled,
			frecency: calculateFrecency( time as number, count ),
		};
		if ( buildScope === 'transform' ) {
			return blockItemBase;
		}

		const inserterVariations =
			getBlockVariations( blockType.name, 'inserter' ) || [];
		const blockVariations =
			getBlockVariations( blockType.name, 'block' ) || [];
		const allVariations = [
			...inserterVariations,
			// Built-in heading level variations have block scope but allow
			// insertion via slash inserter.
			// See https://github.com/WordPress/gutenberg/issues/74233.
			...blockVariations
				.filter(
					( variation ) =>
						blockType.name === 'core/heading' &&
						[ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ].includes(
							variation.name
						)
				)
				.map( ( variation ) => ( {
					...variation,
					isSearchOnly: true,
				} ) ),
		];
		return {
			...blockItemBase,
			initialAttributes: {},
			description: blockType.description,
			category: blockType.category,
			keywords: blockType.keywords,
			parent: blockType.parent,
			ancestor: blockType.ancestor,
			variations: allVariations,
			example: blockType.example,
			utility: 1, // Deprecated.
		} as WPEditorInserterItem;
	};

const buildBlockVariationItem =
	( state: State, item: WPEditorInserterItem ) =>
	( variation: BlockVariation ): WPEditorTransformItem => {
		const variationId = `${ item.id }/${ variation.name }`;
		const { time, count = 0 } = getInsertUsage( state, variationId ) || {};
		return {
			...item,
			id: variationId,
			icon: variation.icon || item.icon,
			title: variation.title || item.title,
			frecency: calculateFrecency( time as number, count ),
			variationName: variation.name,
		} as WPEditorTransformItem;
	};

/**
 * Determines the items that appear in the inserter. Includes both static
 * items (e.g. a regular block type) and dynamic items (e.g. a reusable block).
 *
 * Each item object contains what's necessary to display a button in the
 * inserter and handle its selection.
 *
 * The 'frecency' property is a heuristic (https://en.wikipedia.org/wiki/Frecency)
 * that combines block usage frequency and recency.
 *
 * Items are returned ordered descendingly by their 'utility' and 'frecency'.
 */
interface WPEditorInserterItem {
	/**
	 * Unique identifier for the item.
	 */
	id: string;
	/**
	 * The type of block to create.
	 */
	name: string;
	/**
	 * Attributes to pass to the newly created block.
	 */
	initialAttributes: Record< string, any >;
	/**
	 * Title of the item, as it appears in the inserter.
	 */
	title: string;
	/**
	 * Dashicon for the item, as it appears in the inserter.
	 */
	icon: string | { src: string; foreground?: string };
	/**
	 * Block category that the item is associated with.
	 */
	category: string;
	/**
	 * Keywords that can be searched to find this item.
	 */
	keywords: string[];
	/*
	 * Whether or not the user should be prevented from inserting this item.
	 */
	isDisabled: boolean;
	/**
	 * Heuristic that combines frequency and recency.
	 */
	frecency: number;
	/**
	 * Block variations for the item, if any.
	 */
	variations?: BlockVariation[];
	/**
	 * Additional properties for the item, if any.
	 */
	[ key: string ]: unknown;
}
export const getInserterItems = createRegistrySelector(
	( select: typeof globalSelect ) =>
		createSelector(
			(
				state: State,
				rootClientId: string | null = null,
				options = DEFAULT_INSERTER_OPTIONS
			) => {
				const buildReusableBlockInserterItem = (
					reusableBlock: UserPattern
				) => {
					const icon = ! reusableBlock.wp_pattern_sync_status
						? {
								src: symbol,
								foreground: 'var(--wp-block-synced-color)',
						  }
						: symbol;
					const userPattern = mapUserPattern( reusableBlock );
					const { time, count = 0 } =
						getInsertUsage( state, userPattern.name ) || {};
					const frecency = calculateFrecency( time as number, count );

					return {
						id: userPattern.name,
						name: 'core/block',
						initialAttributes: { ref: reusableBlock.id },
						title: userPattern.title,
						icon,
						category: 'reusable',
						keywords: [ 'reusable' ],
						isDisabled: false,
						utility: 1, // Deprecated.
						frecency,
						content: userPattern.content,
						get blocks() {
							return getParsedPattern( userPattern as Pattern )
								.blocks;
						},
						syncStatus: userPattern.syncStatus,
					};
				};

				const patternInserterItems = canInsertBlockTypeUnmemoized(
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
					.map(
						buildBlockTypeInserterItem
					) as WPEditorInserterItem[];

				if ( options[ isFiltered ] !== false ) {
					blockTypeInserterItems = blockTypeInserterItems.filter(
						( blockType ) =>
							canIncludeBlockTypeInInserter(
								state,
								blockType as unknown as BlockType,
								rootClientId ?? undefined
							)
					);
				} else {
					const { getClosestAllowedInsertionPoint } = unlock(
						select( STORE_NAME )
					);
					blockTypeInserterItems = blockTypeInserterItems
						.filter(
							( blockType ) =>
								isBlockVisibleInTheInserter(
									state,
									blockType as any,
									rootClientId
								) &&
								getClosestAllowedInsertionPoint(
									blockType.name,
									rootClientId
								) !== null
						)
						.map( ( blockType ) => ( {
							...blockType,
							isAllowedInCurrentRoot:
								canIncludeBlockTypeInInserter(
									state,
									blockType as unknown as BlockType,
									rootClientId ?? undefined
								),
						} ) );
				}

				const items = blockTypeInserterItems.reduce(
					(
						accumulator: WPEditorInserterItem[],
						item: WPEditorInserterItem
					) => {
						const { variations = [] } = item;
						// Exclude any block type item that is to be replaced by a default variation.
						if (
							! variations.some(
								( { isDefault }: { isDefault?: boolean } ) =>
									isDefault
							)
						) {
							accumulator.push( item );
						}
						if ( variations.length ) {
							const variationMapper = getItemFromVariation(
								state,
								item
							);
							accumulator.push(
								...( variations.map(
									variationMapper
								) as WPEditorInserterItem[] )
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
				const groupByType = (
					blocks: {
						core: WPEditorInserterItem[];
						noncore: WPEditorInserterItem[];
					},
					block: WPEditorInserterItem
				) => {
					const { core, noncore } = blocks;
					const type = block.name.startsWith( 'core/' )
						? core
						: noncore;

					type.push( block );
					return blocks;
				};
				const { core: coreItems, noncore: nonCoreItems } = items.reduce(
					groupByType,
					{ core: [], noncore: [] }
				);
				const sortedBlockTypes = [ ...coreItems, ...nonCoreItems ];
				return [ ...sortedBlockTypes, ...patternInserterItems ];
			},
			( state, rootClientId ) => [
				getBlockTypes(),
				unlock( select( STORE_NAME ) ).getReusableBlocks(),
				state.blocks.order,
				state.preferences.insertUsage,
				...getInsertBlockTypeDependants()( state, rootClientId ),
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
 * that combines block usage frequency and recency.
 *
 * Items are returned ordered descendingly by their 'frecency'.
 */

interface WPEditorTransformItem {
	/**
	 * Unique identifier for the item.
	 */
	id: string;
	/**
	 * The type of block to create.
	 */
	name: string;
	/**
	 * The target block variation name.
	 */
	variationName?: string;
	/**
	 * 	Title of the item, as it appears in the inserter.
	 */
	title: string;
	/**
	 * Dashicon for the item, as it appears in the inserter.
	 */
	icon: any;
	/**
	 * Whether or not the user should be prevented from inserting this item.
	 */
	isDisabled: boolean;
	/**
	 * Heuristic that combines frequency and recency.
	 */
	frecency: number;
	[ key: string ]: unknown;
}
export const getBlockTransformItems = createRegistrySelector( () =>
	createSelector(
		( state, blocks, rootClientId = null ) => {
			const normalizedBlocks = Array.isArray( blocks )
				? blocks
				: [ blocks ];
			const buildBlockTypeTransformItem = buildBlockTypeItem( state, {
				buildScope: 'transform',
			} );
			const blockTypeTransformItems = getBlockTypes()
				.filter( ( blockType ) =>
					canIncludeBlockTypeInInserter(
						state,
						blockType,
						rootClientId
					)
				)
				.map( buildBlockTypeTransformItem );

			const itemsByName = Object.fromEntries(
				Object.entries( blockTypeTransformItems ).map(
					( [ , value ] ) => [ value.name, value ]
				)
			);

			const possibleTransforms = getPossibleBlockTransformations(
				normalizedBlocks
			).reduce( ( accumulator: WPEditorTransformItem[], block ) => {
				const item = itemsByName[ block?.name ];

				if ( ! item ) {
					return accumulator;
				}

				const { variationName } = block as {
					name: string;
					variationName?: string;
				};

				if ( ! variationName ) {
					accumulator.push( item );
					return accumulator;
				}

				const variation = getBlockVariations(
					item.name,
					'transform'
				)?.find( ( { name } ) => name === variationName );

				if ( ! variation ) {
					accumulator.push( item );
					return accumulator;
				}

				accumulator.push(
					buildBlockVariationItem(
						state,
						item as WPEditorInserterItem
					)( variation )
				);
				return accumulator;
			}, [] );
			return orderBy(
				possibleTransforms as any,
				( block ) => ( block as WPEditorTransformItem ).frecency,
				'desc'
			);
		},
		(
			state: State,
			blocks: Block | Block[],
			rootClientId: string | null
		) => [
			getBlockTypes(),
			state.preferences.insertUsage,
			...getInsertBlockTypeDependants()(
				state,
				rootClientId ?? undefined
			),
		]
	)
);

/**
 * Determines whether there are items to show in the inserter.
 *
 * @param state        Editor state.
 * @param rootClientId Optional root client ID of block list.
 *
 * @return Items that appear in inserter.
 */
export const hasInserterItems = (
	state: State,
	rootClientId = null
): unknown => {
	const hasBlockType = getBlockTypes().some( ( blockType ) =>
		canIncludeBlockTypeInInserter(
			state,
			blockType,
			rootClientId ?? undefined
		)
	);
	if ( hasBlockType ) {
		return true;
	}
	const hasReusableBlock = canInsertBlockTypeUnmemoized(
		state,
		'core/block',
		rootClientId
	);

	return hasReusableBlock;
};

/**
 * Returns the list of allowed inserter blocks for inner blocks children.
 *
 * @param  state        Editor state.
 * @param  rootClientId Optional root client ID of block list.
 *
 * @return {Array?} The list of allowed block types.
 */
export const getAllowedBlocks = createRegistrySelector( () =>
	createSelector(
		( state, rootClientId = null ) => {
			if ( ! rootClientId ) {
				return;
			}

			const blockTypes = getBlockTypes().filter( ( blockType ) =>
				canIncludeBlockTypeInInserter( state, blockType, rootClientId )
			);

			const hasReusableBlock = canInsertBlockTypeUnmemoized(
				state,
				'core/block',
				rootClientId ?? undefined
			);

			if ( hasReusableBlock ) {
				const coreBlock = getBlockType( 'core/block' );
				if ( coreBlock ) {
					blockTypes.push( coreBlock );
				}
			}

			return blockTypes;
		},
		( state: State, rootClientId: string | null ) => [
			getBlockTypes(),
			...getInsertBlockTypeDependants()(
				state,
				rootClientId ?? undefined
			),
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
	( state: State, rootClientId: string | null ) =>
		// @ts-ignore: This is a deprecated selector, so we don't need to worry about the type here.
		getAllowedBlocks.getDependants( state, rootClientId )
);

export function getDirectInsertBlock(
	state: State,
	rootClientId: string | null = null
) {
	if ( ! rootClientId ) {
		return;
	}
	const { defaultBlock, directInsert } =
		state.blockListSettings.get( rootClientId ) ?? {};
	if ( ! defaultBlock || ! directInsert ) {
		return;
	}

	return defaultBlock;
}

export function __experimentalGetDirectInsertBlock(
	state: State,
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

const getAllowedPatternsDependants =
	( select: typeof globalSelect ) =>
	( state: State, rootClientId: string | null ) => [
		...getAllPatternsDependants( select )( state ),
		...getInsertBlockTypeDependants()( state, rootClientId ?? undefined ),
	];

const patternsWithParsedBlocks = new WeakMap();
function enhancePatternWithParsedBlocks( pattern: Pattern ) {
	let enhancedPattern = patternsWithParsedBlocks.get( pattern );
	if ( ! enhancedPattern ) {
		enhancedPattern = {
			...pattern,
			get blocks() {
				return getParsedPattern( pattern ).blocks;
			},
		};
		patternsWithParsedBlocks.set( pattern, enhancedPattern );
	}
	return enhancedPattern;
}

/**
 * Returns the list of allowed patterns for inner blocks children.
 *
 * @param  state        Editor state.
 * @param  rootClientId Optional target root client ID.
 *
 * @return {Array?} The list of allowed patterns.
 */
export const __experimentalGetAllowedPatterns = createRegistrySelector(
	( select ) => {
		return createSelector(
			(
				state,
				rootClientId = null,
				options = DEFAULT_INSERTER_OPTIONS
			) => {
				const { getAllPatterns } = unlock( select( STORE_NAME ) );
				const patterns = getAllPatterns();
				const { allowedBlockTypes } = getSettings( state );
				const parsedPatterns = patterns
					.filter( ( { inserter = true } ) => !! inserter )
					.map( enhancePatternWithParsedBlocks );

				const availableParsedPatterns = parsedPatterns.filter(
					( pattern: Pattern ) =>
						checkAllowListRecursive(
							getGrammar( pattern ),
							allowedBlockTypes
						)
				);
				const patternsAllowed = availableParsedPatterns.filter(
					( pattern: Pattern ) =>
						getGrammar( pattern ).every( ( { blockName: name } ) =>
							options[ isFiltered ] !== false
								? canInsertBlockType(
										state,
										name as string,
										rootClientId
								  )
								: isBlockVisibleInTheInserter(
										state,
										name as string,
										rootClientId
								  )
						)
				);

				return patternsAllowed;
			},
			getAllowedPatternsDependants( select )
		);
	}
);

/**
 * Returns the list of patterns based on their declared `blockTypes`
 * and a block's name.
 * Patterns can use `blockTypes` to integrate in work flows like
 * suggesting appropriate patterns in a Placeholder state(during insertion)
 * or blocks transformations.
 *
 * @param                   state        Editor state.
 * @param {string|string[]} blockNames   Block's name or array of block names to find matching patterns.
 * @param                   rootClientId Optional target root client ID.
 *
 * @return {Array} The list of matched block patterns based on declared `blockTypes` and block name.
 */
export const getPatternsByBlockTypes = createRegistrySelector( ( select ) =>
	createSelector(
		(
			state: State,
			blockNames: string | string[],
			rootClientId: string | null = null
		) => {
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
			const filteredPatterns = patterns.filter(
				( pattern: Pattern ) =>
					pattern?.blockTypes?.some?.( ( blockName: string ) =>
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
 * @param            state        Editor state.
 * @param {Object[]} blocks       The selected blocks.
 * @param            rootClientId Optional root client ID of block list.
 *
 * @return {WPBlockPattern[]} Items that are eligible for a pattern transformation.
 */
export const __experimentalGetPatternTransformItems = createRegistrySelector(
	( select ) =>
		createSelector(
			(
				state: State,
				blocks: Block[],
				rootClientId: string | null = null
			) => {
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
 * @param  state    Editor state.
 * @param  clientId Block client ID.
 *
 * @return {?Object} Block settings of the block if set.
 */
export function getBlockListSettings(
	state: State,
	clientId: string
): BlockListSettings | undefined {
	if ( ! clientId ) {
		return undefined;
	}
	return state.blockListSettings.get( clientId );
}

/**
 * Returns the editor settings.
 *
 * @param state Editor state.
 *
 * @return The editor settings object.
 */
export function getSettings( state: State ): EditorSettings {
	return state.settings;
}

/**
 * Returns true if the most recent block change is be considered persistent, or
 * false otherwise. A persistent change is one committed by BlockEditorProvider
 * via its `onChange` callback, in addition to `onInput`.
 *
 * @param state Block editor state.
 *
 * @return Whether the most recent block change was persistent.
 */
export function isLastBlockChangePersistent( state: State ): boolean {
	return state.blocks.isPersistentChange;
}

/**
 * Returns how the most recent block change interacts with undo history.
 *
 * - `persistent` changes create a new undo level.
 * - `merge` changes do not create a new undo level, but may merge into the
 *    prior stack item history.
 * - `ignore` changes should never be captured by undo history.
 *
 * @param state Block editor state.
 *
 * @return Block change history behavior.
 */
export function __unstableGetLastBlockChangeHistoryMode( state: State ) {
	if ( state.blocks.lastBlockChangeHistoryMode ) {
		return state.blocks.lastBlockChangeHistoryMode;
	}
	return state.blocks.isPersistentChange === false ? 'merge' : 'persistent';
}

/**
 * Returns the block list settings for an array of blocks, if any exist.
 *
 * @param state     Editor state.
 * @param clientIds Block client IDs.
 *
 * @return An object where the keys are client ids and the values are
 *                  a block list setting object.
 */
export const __experimentalGetBlockListSettingsForBlocks = createSelector(
	(
		state: State,
		clientIds: string[] = []
	): Record< string, BlockListSettings > => {
		const blockListSettingsForBlocks: Record< string, BlockListSettings > =
			{};
		for ( const clientId of clientIds ) {
			const settings = getBlockListSettings( state, clientId );
			if ( settings ) {
				blockListSettingsForBlocks[ clientId ] = settings;
			}
		}
		return blockListSettingsForBlocks;
	},
	( state ) => [ state.blockListSettings ]
);

/**
 * Returns the title of a given reusable block
 *
 * @param state Global application state.
 * @param ref   The shared block's ID.
 *
 * @return  The reusable block saved title.
 */
export const __experimentalGetReusableBlockTitle = createRegistrySelector(
	( select ) =>
		createSelector(
			( state, ref: number | string ) => {
				deprecated(
					"wp.data.select( 'core/block-editor' ).__experimentalGetReusableBlockTitle",
					{
						since: '6.6',
						version: '6.8',
					}
				);

				const reusableBlock = unlock( select( STORE_NAME ) )
					.getReusableBlocks()
					.find( ( block: UserPattern ) => block.id === ref );
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
 * @param state Block editor state.
 *
 * @return Whether the most recent block change was ignored.
 */
export function __unstableIsLastBlockChangeIgnored( state: State ): boolean {
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
 * @param  state Block editor state.
 *
 * @return {Object<string,Object>} Subsets of block attributes changed, keyed
 *                                 by block client ID.
 */
export function __experimentalGetLastBlockAttributeChanges( state: State ) {
	return state.lastBlockAttributesChange;
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
 * @param state Global application state.
 *
 * @return Whether the last change was automatic.
 */
export function didAutomaticChange( state: State ): boolean {
	return !! state.automaticChangeStatus;
}

/**
 * Returns true if the current highlighted block matches the block clientId.
 *
 * @param state    Global application state.
 * @param clientId The block to check.
 *
 * @return Whether the block is currently highlighted.
 */
export function isBlockHighlighted( state: State, clientId: string ): boolean {
	return state.highlightedBlock === clientId;
}

/**
 * Checks if a given block has controlled inner blocks.
 *
 * @param state    Global application state.
 * @param clientId The block to check.
 *
 * @return  True if the block has controlled inner blocks.
 */
export function areInnerBlocksControlled(
	state: State,
	clientId: string
): boolean {
	return state.blocks.controlledInnerBlocks.has( clientId );
}

/**
 * Returns the clientId for the first 'active' block of a given array of block names.
 * A block is 'active' if it (or a child) is the selected block.
 * Returns the first match moving up the DOM from the selected block.
 *
 * @param state            Global application state.
 * @param validBlocksNames The names of block types to check for.
 *
 * @return  The matching block's clientId.
 */
export const __experimentalGetActiveBlockIdByBlockNames = createSelector(
	( state: State, validBlockNames: string[] ): string | null => {
		if ( ! validBlockNames.length ) {
			return null;
		}
		// Check if selected block is a valid entity area.
		const selectedBlockClientId = getSelectedBlockClientId( state );
		const selectedBlockName = getBlockName(
			state,
			selectedBlockClientId ?? undefined
		);

		if (
			selectedBlockName &&
			validBlockNames.includes( selectedBlockName )
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
 * @param state    Global application state.
 * @param clientId Client Id of the block.
 * @param source   Optional insertion source of the block.
 * @return True if the block matches the last block inserted from the specified source.
 */
export function wasBlockJustInserted(
	state: State,
	clientId: string,
	source?: string
): boolean | undefined {
	const { lastBlockInserted } = state;
	return (
		lastBlockInserted.clientIds?.includes( clientId ) &&
		lastBlockInserted.source === source
	);
}

/**
 * Tells if the block is visible on the canvas or not.
 *
 * @param state    Global application state.
 * @param clientId Client Id of the block.
 * @return True if the block is visible.
 */
export function isBlockVisible( state: State, clientId: string ): boolean {
	return state.blockVisibility?.[ clientId ] ?? true;
}

/**
 * Returns the currently hovered block.
 *
 * @deprecated
 */
export function getHoveredBlockClientId() {
	deprecated(
		"wp.data.select( 'core/block-editor' ).getHoveredBlockClientId",
		{
			since: '6.9',
			version: '7.1',
		}
	);
	return undefined;
}

/**
 * Returns the list of all hidden blocks.
 *
 * @param  state Global application state.
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

export function __unstableHasActiveBlockOverlayActive(
	state: State,
	clientId: string
) {
	// Prevent overlay on blocks with a non-default editing mode. If the mode is
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

	// In zoom-out mode, the block overlay is always active for section level blocks.
	if ( isZoomOut( state ) ) {
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

	const blockName = getBlockName( state, clientId );

	if ( ! blockName ) {
		return false;
	}
	const blockSupportDisable = hasBlockSupport(
		blockName,
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

export function __unstableIsWithinBlockOverlay(
	state: State,
	clientId: string
) {
	let parent = state.blocks.parents.get( clientId );
	while ( !! parent ) {
		if ( __unstableHasActiveBlockOverlayActive( state, parent ) ) {
			return true;
		}
		parent = state.blocks.parents.get( parent );
	}
	return false;
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
 * @param  state    Global application state.
 * @param  clientId The block client ID, or `''` for the root container.
 *
 * @return {BlockEditingMode} The block editing mode. One of `'disabled'`,
 *                            `'contentOnly'`, or `'default'`.
 */
export function getBlockEditingMode( state: State, clientId = '' ) {
	// Some selectors that call this provide `null` as the default
	// rootClientId, but the default rootClientId is actually `''`.
	if ( clientId === null ) {
		clientId = '';
	}

	// Check if the clientId has an editing mode set in the regular derived map.
	// There may be an editing mode set here for synced patterns or in zoomed out
	// mode.
	if ( state.derivedBlockEditingModes?.has( clientId ) ) {
		return state.derivedBlockEditingModes.get( clientId );
	}

	// In normal mode, consider that an explicitly set editing mode takes over.
	if ( state.blocks.blockEditingModes.has( clientId ) ) {
		return state.blocks.blockEditingModes.get( clientId );
	}

	return 'default';
}

/**
 * Indicates if a block is ungroupable.
 * A block is ungroupable if it is a single grouping block with inner blocks.
 * If a block has an `ungroup` transform, it is also ungroupable, without the
 * requirement of being the default grouping block.
 * Additionally a block can only be ungrouped if it has inner blocks and can
 * be removed.
 * Section blocks are not ungroupable.
 *
 * @param state    Global application state.
 * @param clientId Client Id of the block. If not passed the selected block's client id will be used.
 * @return True if the block is ungroupable.
 */
export const isUngroupable = createRegistrySelector(
	( select ) =>
		( state: State, clientId: string = '' ) => {
			const _clientId = clientId || getSelectedBlockClientId( state );
			if ( ! _clientId ) {
				return false;
			}

			// Section blocks should not be ungroupable.
			if ( isSectionBlock( state, _clientId ) ) {
				return false;
			}

			const { getGroupingBlockName } = select( blocksStore ) as {
				getGroupingBlockName: () => string;
			};
			const block = getBlock( state, _clientId );
			const groupingBlockName = getGroupingBlockName();
			const _isUngroupable =
				block &&
				( block.name === groupingBlockName ||
					(
						getBlockType( block.name )?.transforms as Record<
							string,
							unknown
						>
					 )?.ungroup ) &&
				!! block.innerBlocks.length;

			return _isUngroupable && canRemoveBlock( state, _clientId );
		}
);

/**
 * Indicates if the provided blocks(by client ids) are groupable.
 * We need to have at least one block, have a grouping block name set and
 * be able to remove these blocks.
 *
 * @param state     Global application state.
 * @param clientIds Block client ids. If not passed the selected blocks client ids will be used.
 * @return True if the blocks are groupable.
 */
export const isGroupable = createRegistrySelector(
	( select ) =>
		( state: State, clientIds: string[] = EMPTY_ARRAY ): boolean => {
			const { getGroupingBlockName } = select( blocksStore ) as {
				getGroupingBlockName: () => string;
			};
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
			return !! _isGroupable && canRemoveBlocks( state, _clientIds );
		}
);

/**
 * DO-NOT-USE in production.
 * This selector is created for internal/experimental only usage and may be
 * removed anytime without any warning, causing breakage on any plugin or theme invoking it.
 *
 * @deprecated
 *
 * @param state    Global application state.
 * @param clientId Client Id of the block.
 *
 * @return  Client ID of the ancestor block that is content locking the block.
 */
export const __unstableGetContentLockingParent = (
	state: State,
	clientId: string
) => {
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
 * @param state Global application state.
 */
export function __unstableGetTemporarilyEditingAsBlocks( state: State ) {
	deprecated(
		"wp.data.select( 'core/block-editor' ).__unstableGetTemporarilyEditingAsBlocks",
		{
			since: '6.1',
			version: '6.7',
		}
	);
	return getEditedContentOnlySection( state );
}
