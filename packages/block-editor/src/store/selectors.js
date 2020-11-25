/**
 * External dependencies
 */
import {
	castArray,
	flatMap,
	first,
	isArray,
	isBoolean,
	last,
	map,
	reduce,
	some,
	find,
	filter,
	findIndex,
} from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getBlockType,
	getBlockTypes,
	hasBlockSupport,
	parse,
} from '@wordpress/blocks';
import { SVG, Rect, G, Path } from '@wordpress/components';
import { Platform } from '@wordpress/element';
import { createAtomSelector } from '@wordpress/stan';

/**
 * Internal dependencies
 */
import {
	blockAttributesByClientId,
	blockMetadataByClientId,
	blockOrderByClientId,
	initialPosition,
	selectionEnd,
	selectionStart,
	isMultiSelecting as isMultiSelectingAtom,
	isSelectionEnabled as isSelectionEnabledAtom,
	isTyping as isTypingAtom,
	isCaretWithinFormattedText as isCaretWithinFormattedTextAtom,
	insertionPoint as insertionPointAtom,
	isNavigationMode as isNavigationModeAtom,
	hasBlockMovingClientId as hasBlockMovingClientIdAtom,
	template,
	settings,
	insertionPointVisibility,
	blocksModeByClientId,
	draggedBlocks,
	blockListSettingsByClientId,
	highlightedBlock,
	controlledInnerBlocks,
	preferences,
} from './atoms';

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

// Module constants
const MILLISECONDS_PER_HOUR = 3600 * 1000;
const MILLISECONDS_PER_DAY = 24 * 3600 * 1000;
const MILLISECONDS_PER_WEEK = 7 * 24 * 3600 * 1000;
const templateIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path d="M19 3H5c-1.105 0-2 .895-2 2v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2zM6 6h5v5H6V6zm4.5 13C9.12 19 8 17.88 8 16.5S9.12 14 10.5 14s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm3-6l3-5 3 5h-6z" />
		</G>
	</SVG>
);

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

const getBlockMetadata = createAtomSelector( ( clientId ) => ( { get } ) => {
	return get( blockMetadataByClientId )[ clientId ];
} );

/**
 * Returns a block's name given its client ID, or null if no block exists with
 * the client ID.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {string} Block name.
 */
export const getBlockName = createAtomSelector( ( clientId ) => ( { get } ) => {
	const blockMetadata = get( getBlockMetadata( clientId ) );
	const socialLinkName = 'core/social-link';

	if ( Platform.OS !== 'web' && blockMetadata?.name === socialLinkName ) {
		const attributes = get( getBlockAttributes( clientId ) );
		const { service } = attributes;

		return service ? `${ socialLinkName }-${ service }` : socialLinkName;
	}
	return blockMetadata ? blockMetadata.name : null;
} );

/**
 * Returns whether a block is valid or not.
 *
 * @param {string} clientId Block client ID.
 *
 * @return {boolean} Is Valid.
 */
export const isBlockValid = createAtomSelector( ( clientId ) => ( { get } ) => {
	const blockMetadata = get( getBlockMetadata( clientId ) );
	return !! blockMetadata && blockMetadata.isValid;
} );

/**
 * Returns a block's attributes given its client ID, or null if no block exists with
 * the client ID.
 *
 * @param {string} clientId Block client ID.
 *
 * @return {Object?} Block attributes.
 */
export const getBlockAttributes = createAtomSelector(
	( clientId ) => ( { get } ) => {
		return get( blockAttributesByClientId( clientId ) );
	}
);

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
 * @param {string} clientId Block client ID.
 *
 * @return {Object} Parsed block object.
 */
export const getBlock = createAtomSelector( ( clientId ) => ( { get } ) => {
	const blockMetadata = get( getBlockMetadata( clientId ) );
	if ( ! blockMetadata ) {
		return null;
	}

	return {
		...blockMetadata,
		attributes: get( getBlockAttributes( clientId ) ),
		innerBlocks: get( areInnerBlocksControlled( clientId ) )
			? EMPTY_ARRAY
			: get( getBlocks( clientId ) ),
	};
} );

export const __unstableGetBlockWithoutInnerBlocks = createAtomSelector(
	( clientId ) => ( { get } ) => {
		const blockMetadata = get( getBlockMetadata( clientId ) );
		if ( ! blockMetadata ) {
			return null;
		}

		return {
			...blockMetadata,
			attributes: get( getBlockAttributes( clientId ) ),
		};
	}
);

/**
 * Returns all block objects for the current post being edited as an array in
 * the order they appear in the post. Note that this will exclude child blocks
 * of nested inner block controllers.
 *
 * Note: It's important to memoize this selector to avoid return a new instance
 * on each call. We use the block cache state for each top-level block of the
 * given clientID. This way, the selector only refreshes on changes to blocks
 * associated with the given entity, and does not refresh when changes are made
 * to blocks which are part of different inner block controllers.
 *
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {Object[]} Post blocks.
 */
export const getBlocks = createAtomSelector(
	( rootClientId ) => ( { get } ) => {
		return map( get( getBlockOrder( rootClientId ) ), ( clientId ) =>
			get( getBlock( clientId ) )
		);
	}
);

/**
 * Similar to getBlock, except it will include the entire nested block tree as
 * inner blocks. The normal getBlock selector will exclude sections of the block
 * tree which belong to different entities.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Client ID of the block to get.
 *
 * @return {Object} The block with all
 */
export const __unstableGetBlockWithBlockTree = createAtomSelector(
	( clientId ) => ( { get } ) => {
		const blockMetadata = get( getBlockMetadata( clientId ) );
		if ( ! blockMetadata ) {
			return null;
		}

		return {
			...blockMetadata,
			attributes: get( getBlockAttributes( clientId ) ),
			innerBlocks: get( __unstableGetBlockTree( clientId ) ),
		};
	}
);

/**
 * Similar to getBlocks, except this selector returns the entire block tree
 * represented in the block-editor store from the given root regardless of any
 * inner block controllers.
 *
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {Object[]} Post blocks.
 */
export const __unstableGetBlockTree = createAtomSelector(
	( rootClientId = '' ) => ( { get } ) =>
		map( get( getBlockOrder( rootClientId ) ), ( clientId ) =>
			get( __unstableGetBlockWithBlockTree( clientId ) )
		)
);

/**
 * Returns an array containing the clientIds of all descendants
 * of the blocks given.
 *
 * @param {Array} clientIds Array of blocks to inspect.
 *
 * @return {Array} ids of descendants.
 */
export const getClientIdsOfDescendants = createAtomSelector(
	( clientIds ) => ( { get } ) =>
		flatMap( clientIds, ( clientId ) => {
			const descendants = get( getBlockOrder( clientId ) );
			return [
				...descendants,
				...get( getClientIdsOfDescendants( descendants ) ),
			];
		} )
);

/**
 * Returns an array containing the clientIds of the top-level blocks
 * and their descendants of any depth (for nested blocks).
 *
 * @return {Array} ids of top-level and descendant blocks.
 */
export const getClientIdsWithDescendants = createAtomSelector(
	() => ( { get } ) => {
		const topLevelIds = get( getBlockOrder() );
		return [
			...topLevelIds,
			...get( getClientIdsOfDescendants( topLevelIds ) ),
		];
	}
);

/**
 * Returns the total number of blocks, or the total number of blocks with a specific name in a post.
 * The number returned includes nested blocks.
 *
 * @param {?string} blockName Optional block name, if specified only blocks of that type will be counted.
 *
 * @return {number} Number of blocks in the post, or number of blocks with name equal to blockName.
 */
export const getGlobalBlockCount = createAtomSelector(
	( blockName ) => ( { get } ) => {
		const clientIds = get( getClientIdsWithDescendants() );
		if ( ! blockName ) {
			return clientIds.length;
		}
		return reduce(
			clientIds,
			( accumulator, clientId ) => {
				const blockMetadata = get( getBlockMetadata( clientId ) );
				return blockMetadata.name === blockName
					? accumulator + 1
					: accumulator;
			},
			0
		);
	}
);

/**
 * Given an array of block client IDs, returns the corresponding array of block
 * objects.
 *
 * @param {string[]} clientIds Client IDs for which blocks are to be returned.
 *
 * @return {WPBlock[]} Block objects.
 */
export const getBlocksByClientId = createAtomSelector(
	( clientIds ) => ( { get } ) =>
		map( castArray( clientIds ), ( clientId ) =>
			get( getBlock( clientId ) )
		)
);

/**
 * Returns the number of blocks currently present in the post.
 *
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {number} Number of blocks in the post.
 */
export const getBlockCount = createAtomSelector(
	( rootClientId ) => ( { get } ) =>
		get( getBlockOrder( rootClientId ) ).length
);

/**
 * Returns the current selection start block client ID, attribute key and text
 * offset.
 *
 * @return {WPBlockSelection} Selection start information.
 */
export const getSelectionStart = createAtomSelector( () => ( { get } ) =>
	get( selectionStart )
);

/**
 * Returns the current selection end block client ID, attribute key and text
 * offset.
 *
 * @return {WPBlockSelection} Selection end information.
 */
export const getSelectionEnd = createAtomSelector( () => ( { get } ) =>
	get( selectionEnd )
);

/**
 * Returns the current block selection start. This value may be null, and it
 * may represent either a singular block selection or multi-selection start.
 * A selection is singular if its start and end match.
 *
 * @return {?string} Client ID of block selection start.
 */
export const getBlockSelectionStart = createAtomSelector( () => ( { get } ) =>
	get( selectionStart ).clientId
);

/**
 * Returns the current block selection end. This value may be null, and it
 * may represent either a singular block selection or multi-selection end.
 * A selection is singular if its start and end match.
 *
 * @return {?string} Client ID of block selection end.
 */
export const getBlockSelectionEnd = createAtomSelector( () => ( { get } ) =>
	get( selectionEnd ).clientId
);

/**
 * Returns the number of blocks currently selected in the post.
 *
 * @return {number} Number of blocks selected in the post.
 */
export const getSelectedBlockCount = createAtomSelector( () => ( { get } ) => {
	const multiSelectedBlockCount = get( getMultiSelectedBlockClientIds() )
		.length;

	if ( multiSelectedBlockCount ) {
		return multiSelectedBlockCount;
	}

	return get( selectionStart ).clientId ? 1 : 0;
} );

/**
 * Returns true if there is a single selected block, or false otherwise.
 *
 * @return {boolean} Whether a single block is selected.
 */
export const hasSelectedBlock = createAtomSelector( () => ( { get } ) => {
	return (
		!! get( selectionStart ).clientId &&
		get( selectionStart ).clientId === get( selectionEnd ).clientId
	);
} );

/**
 * Returns the currently selected block client ID, or null if there is no
 * selected block.
 *
 * @return {?string} Selected block client ID.
 */
export const getSelectedBlockClientId = createAtomSelector(
	() => ( { get } ) => {
		const { clientId } = get( selectionStart );
		if ( ! clientId || clientId !== get( selectionEnd ).clientId ) {
			return null;
		}

		return clientId;
	}
);

/**
 * Returns the currently selected block, or null if there is no selected block.
 *
 * @return {?Object} Selected block.
 */
export const getSelectedBlock = createAtomSelector( () => ( { get } ) => {
	const clientId = get( getSelectedBlockClientId() );
	return clientId ? get( getBlock( clientId ) ) : null;
} );

/**
 * Given a block client ID, returns the root block from which the block is
 * nested, an empty string for top-level blocks, or null if the block does not
 * exist.
 *
 * @param {string} clientId Block from which to find root client ID.
 *
 * @return {?string} Root client ID, if exists
 */
export const getBlockRootClientId = createAtomSelector(
	( clientId ) => ( { get } ) => {
		const currentBlockOrder = get( blockOrderByClientId );
		const parentClientId = findIndex( currentBlockOrder, ( subOrder ) =>
			subOrder.includes( clientId )
		);
		return parentClientId || null;
	}
);

/**
 * Given a block client ID, returns the list of all its parents from top to bottom.
 *
 * @param {string} clientId Block from which to find root client ID.
 * @param {boolean} ascending Order results from bottom to top (true) or top to bottom (false).
 *
 * @return {Array} ClientIDs of the parent blocks.
 */
export const getBlockParents = createAtomSelector(
	( clientId, ascending = false ) => ( { get } ) => {
		const parents = [];
		let current = clientId;
		let parent = get( getBlockRootClientId( current ) );
		while ( !! parent ) {
			current = parent;
			parents.push( current );
			parent = get( getBlockRootClientId( current ) );
		}

		return ascending ? parents : parents.reverse();
	}
);

/**
 * Given a block client ID and a block name, returns the list of all its parents
 * from top to bottom, filtered by the given name(s). For example, if passed
 * 'core/group' as the blockName, it will only return parents which are group
 * blocks. If passed `[ 'core/group', 'core/cover']`, as the blockName, it will
 * return parents which are group blocks and parents which are cover blocks.
 *
 * @param {string}          clientId  Block from which to find root client ID.
 * @param {string|string[]} blockName Block name(s) to filter.
 * @param {boolean}         ascending Order results from bottom to top (true) or top to bottom (false).
 *
 * @return {Array} ClientIDs of the parent blocks.
 */
export const getBlockParentsByBlockName = createAtomSelector(
	( clientId, blockName, ascending = false ) => ( { get } ) => {
		const parents = get( getBlockParents( clientId, ascending ) );
		return map(
			filter(
				map( parents, ( id ) => ( {
					id,
					name: get( getBlockName( id ) ),
				} ) ),
				( { name } ) => {
					if ( Array.isArray( blockName ) ) {
						return blockName.includes( name );
					}
					return name === blockName;
				}
			),
			( { id } ) => id
		);
	}
);

/**
 * Given a block client ID, returns the root of the hierarchy from which the block is nested, return the block itself for root level blocks.
 *
 * @param {string} clientId Block from which to find root client ID.
 *
 * @return {string} Root client ID
 */
export const getBlockHierarchyRootClientId = createAtomSelector(
	( clientId ) => ( { get } ) => {
		let current = clientId;
		let parent;
		do {
			parent = current;
			current = get( getBlockRootClientId( current ) );
		} while ( current );
		return parent;
	}
);

/**
 * Given a block client ID, returns the lowest common ancestor with selected client ID.
 *
 * @param {string} clientId Block from which to find common ancestor client ID.
 *
 * @return {string} Common ancestor client ID or undefined
 */
export const getLowestCommonAncestorWithSelectedBlock = createAtomSelector(
	( clientId ) => ( { get } ) => {
		const selectedId = get( getSelectedBlockClientId() );
		const clientParents = [
			...get( getBlockParents( clientId ) ),
			clientId,
		];
		const selectedParents = [
			...get( getBlockParents( selectedId ) ),
			selectedId,
		];

		let lowestCommonAncestor;

		const maxDepth = Math.min(
			clientParents.length,
			selectedParents.length
		);
		for ( let index = 0; index < maxDepth; index++ ) {
			if ( clientParents[ index ] === selectedParents[ index ] ) {
				lowestCommonAncestor = clientParents[ index ];
			} else {
				break;
			}
		}

		return lowestCommonAncestor;
	}
);

/**
 * Returns the client ID of the block adjacent one at the given reference
 * startClientId and modifier directionality. Defaults start startClientId to
 * the selected block, and direction as next block. Returns null if there is no
 * adjacent block.
 *
 * @param {?string} startClientId Optional client ID of block from which to
 *                                search.
 * @param {?number} modifier      Directionality multiplier (1 next, -1
 *                                previous).
 *
 * @return {?string} Return the client ID of the block, or null if none exists.
 */
export const getAdjacentBlockClientId = createAtomSelector(
	( startClientId, modifier = 1 ) => ( { get } ) => {
		// Default to selected block.
		if ( startClientId === undefined ) {
			startClientId = get( getSelectedBlockClientId() );
		}

		// Try multi-selection starting at extent based on modifier.
		if ( startClientId === undefined ) {
			if ( modifier < 0 ) {
				startClientId = get( getFirstMultiSelectedBlockClientId() );
			} else {
				startClientId = get( getLastMultiSelectedBlockClientId() );
			}
		}

		// Validate working start client ID.
		if ( ! startClientId ) {
			return null;
		}

		// Retrieve start block root client ID, being careful to allow the falsey
		// empty string top-level root by explicitly testing against null.
		const rootClientId = get( getBlockRootClientId( startClientId ) );
		if ( rootClientId === null ) {
			return null;
		}

		const order = get( blockOrderByClientId );
		const orderSet = order[ rootClientId ];
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
);

/**
 * Returns the previous block's client ID from the given reference start ID.
 * Defaults start to the selected block. Returns null if there is no previous
 * block.
 *
 * @param {?string} startClientId Optional client ID of block from which to
 *                                search.
 *
 * @return {?string} Adjacent block's client ID, or null if none exists.
 */
export const getPreviousBlockClientId = createAtomSelector(
	( startClientId ) => ( { get } ) => {
		return get( getAdjacentBlockClientId( startClientId, -1 ) );
	}
);

/**
 * Returns the next block's client ID from the given reference start ID.
 * Defaults start to the selected block. Returns null if there is no next
 * block.
 *
 * @param {?string} startClientId Optional client ID of block from which to
 *                                search.
 *
 * @return {?string} Adjacent block's client ID, or null if none exists.
 */
export const getNextBlockClientId = createAtomSelector(
	( startClientId ) => ( { get } ) => {
		return get( getAdjacentBlockClientId( startClientId, 1 ) );
	}
);

/**
 * Returns the initial caret position for the selected block.
 * This position is to used to position the caret properly when the selected block changes.
 *
 * @return {?Object} Selected block.
 */
export const getSelectedBlocksInitialCaretPosition = createAtomSelector(
	() => ( { get } ) => {
		return get( initialPosition );
	}
);

/**
 * Returns the current selection set of block client IDs (multiselection or single selection).
 *
 * @return {Array} Multi-selected block client IDs.
 */
export const getSelectedBlockClientIds = createAtomSelector(
	() => ( { get } ) => {
		const start = get( selectionStart );
		const end = get( selectionEnd );

		if ( start.clientId === undefined || end.clientId === undefined ) {
			return EMPTY_ARRAY;
		}

		if ( start.clientId === end.clientId ) {
			return [ start.clientId ];
		}

		// Retrieve root client ID to aid in retrieving relevant nested block
		// order, being careful to allow the falsey empty string top-level root
		// by explicitly testing against null.
		const rootClientId = get( getBlockRootClientId( start.clientId ) );
		if ( rootClientId === null ) {
			return EMPTY_ARRAY;
		}

		const blockOrder = get( getBlockOrder( rootClientId ) );
		const startIndex = blockOrder.indexOf( start.clientId );
		const endIndex = blockOrder.indexOf( end.clientId );

		if ( startIndex > endIndex ) {
			return blockOrder.slice( endIndex, startIndex + 1 );
		}

		return blockOrder.slice( startIndex, endIndex + 1 );
	}
);

/**
 * Returns the current multi-selection set of block client IDs, or an empty
 * array if there is no multi-selection.
 *
 * @return {Array} Multi-selected block client IDs.
 */
export const getMultiSelectedBlockClientIds = createAtomSelector(
	() => ( { get } ) => {
		const start = get( selectionStart );
		const end = get( selectionEnd );

		if ( start.clientId === end.clientId ) {
			return EMPTY_ARRAY;
		}

		return get( getSelectedBlockClientIds() );
	}
);

/**
 * Returns the current multi-selection set of blocks, or an empty array if
 * there is no multi-selection.
 *
 * @return {Array} Multi-selected block objects.
 */
export const getMultiSelectedBlocks = createAtomSelector( () => ( { get } ) => {
	const multiSelectedBlockClientIds = get( getMultiSelectedBlockClientIds() );
	if ( ! multiSelectedBlockClientIds.length ) {
		return EMPTY_ARRAY;
	}

	return multiSelectedBlockClientIds.map( ( clientId ) =>
		get( getBlock( clientId ) )
	);
} );

/**
 * Returns the client ID of the first block in the multi-selection set, or null
 * if there is no multi-selection.
 *
 *
 * @return {?string} First block client ID in the multi-selection set.
 */
export const getFirstMultiSelectedBlockClientId = createAtomSelector(
	() => ( { get } ) => {
		return first( get( getMultiSelectedBlockClientIds() ) ) || null;
	}
);

/**
 * Returns the client ID of the last block in the multi-selection set, or null
 * if there is no multi-selection.
 *
 * @param {Object} state Editor state.
 *
 * @return {?string} Last block client ID in the multi-selection set.
 */
export const getLastMultiSelectedBlockClientId = createAtomSelector(
	() => ( { get } ) => {
		return last( get( getMultiSelectedBlockClientIds() ) ) || null;
	}
);

/**
 * Returns true if a multi-selection exists, and the block corresponding to the
 * specified client ID is the first block of the multi-selection set, or false
 * otherwise.
 *
 * @param {string} clientId Block client ID.
 *
 * @return {boolean} Whether block is first in multi-selection.
 */
export const isFirstMultiSelectedBlock = createAtomSelector(
	( clientId ) => ( { get } ) => {
		return first( get( getMultiSelectedBlockClientIds() ) ) === clientId;
	}
);

/**
 * Returns true if the client ID occurs within the block multi-selection, or
 * false otherwise.
 *
 * @param {string} clientId Block client ID.
 *
 * @return {boolean} Whether block is in multi-selection set.
 */
export const isBlockMultiSelected = createAtomSelector(
	( clientId ) => ( { get } ) => {
		return (
			get( getMultiSelectedBlockClientIds() ).indexOf( clientId ) !== -1
		);
	}
);

/**
 * Returns true if an ancestor of the block is multi-selected, or false
 * otherwise.
 *
 * @param {string} clientId Block client ID.
 *
 * @return {boolean} Whether an ancestor of the block is in multi-selection
 *                   set.
 */
export const isAncestorMultiSelected = createAtomSelector(
	( clientId ) => ( { get } ) => {
		let ancestorClientId = clientId;
		let isMultiSelected = false;
		while ( ancestorClientId && ! isMultiSelected ) {
			ancestorClientId = get( getBlockRootClientId( ancestorClientId ) );
			isMultiSelected = get( isBlockMultiSelected( ancestorClientId ) );
		}
		return isMultiSelected;
	}
);

/**
 * Returns the client ID of the block which begins the multi-selection set, or
 * null if there is no multi-selection.
 *
 * This is not necessarily the first client ID in the selection.
 *
 * @see getFirstMultiSelectedBlockClientId
 *
 * @return {?string} Client ID of block beginning multi-selection.
 */
export const getMultiSelectedBlocksStartClientId = createAtomSelector(
	() => ( { get } ) => {
		const start = get( selectionStart );
		const end = get( selectionEnd );

		if ( start.clientId === end.clientId ) {
			return null;
		}

		return start.clientId || null;
	}
);

/**
 * Returns the client ID of the block which ends the multi-selection set, or
 * null if there is no multi-selection.
 *
 * This is not necessarily the last client ID in the selection.
 *
 * @see getLastMultiSelectedBlockClientId
 *
 * @return {?string} Client ID of block ending multi-selection.
 */
export const getMultiSelectedBlocksEndClientId = createAtomSelector(
	() => ( { get } ) => {
		const start = get( selectionStart );
		const end = get( selectionEnd );

		if ( start.clientId === end.clientId ) {
			return null;
		}

		return end.clientId || null;
	}
);

/**
 * Returns an array containing all block client IDs in the editor in the order
 * they appear. Optionally accepts a root client ID of the block list for which
 * the order should be returned, defaulting to the top-level block order.
 *
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {Array} Ordered client IDs of editor blocks.
 */
export const getBlockOrder = createAtomSelector(
	( rootClientId ) => ( { get } ) => {
		return get( blockOrderByClientId )[ rootClientId || '' ] || EMPTY_ARRAY;
	}
);

/**
 * Returns the index at which the block corresponding to the specified client
 * ID occurs within the block order, or `-1` if the block does not exist.
 *
 * @param {string}  clientId     Block client ID.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {number} Index at which block exists in order.
 */
export const getBlockIndex = createAtomSelector(
	( clientId, rootClientId ) => ( { get } ) => {
		return get( getBlockOrder( rootClientId ) ).indexOf( clientId );
	}
);

/**
 * Returns true if the block corresponding to the specified client ID is
 * currently selected and no multi-selection exists, or false otherwise.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 *
 * @return {boolean} Whether block is selected and multi-selection exists.
 */
export const isBlockSelected = createAtomSelector(
	( clientId ) => ( { get } ) => {
		const start = get( selectionStart );
		const end = get( selectionEnd );

		if ( start.clientId !== end.clientId ) {
			return false;
		}

		return start.clientId === clientId;
	}
);

/**
 * Returns true if one of the block's inner blocks is selected.
 *
 * @param {string}  clientId Block client ID.
 * @param {boolean} deep     Perform a deep check.
 *
 * @return {boolean} Whether the block as an inner block selected
 */
export const hasSelectedInnerBlock = createAtomSelector(
	( clientId, deep = false ) => ( { get } ) => {
		return some(
			get( getBlockOrder( clientId ) ),
			( innerClientId ) =>
				get( isBlockSelected( innerClientId ) ) ||
				get( isBlockMultiSelected( innerClientId ) ) ||
				( deep && get( hasSelectedInnerBlock( innerClientId, deep ) ) )
		);
	}
);

/**
 * Returns true if the block corresponding to the specified client ID is
 * currently selected but isn't the last of the selected blocks. Here "last"
 * refers to the block sequence in the document, _not_ the sequence of
 * multi-selection, which is why `state.selectionEnd` isn't used.
 *
 * @param {string} clientId Block client ID.
 *
 * @return {boolean} Whether block is selected and not the last in the
 *                   selection.
 */
export const isBlockWithinSelection = createAtomSelector(
	( clientId ) => ( { get } ) => {
		if ( ! clientId ) {
			return false;
		}

		const clientIds = get( getMultiSelectedBlockClientIds() );
		const index = clientIds.indexOf( clientId );
		return index > -1 && index < clientIds.length - 1;
	}
);

/**
 * Returns true if a multi-selection has been made, or false otherwise.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Whether multi-selection has been made.
 */
export const hasMultiSelection = createAtomSelector( () => ( { get } ) => {
	const start = get( selectionStart );
	const end = get( selectionEnd );
	return start.clientId !== end.clientId;
} );

/**
 * Whether in the process of multi-selecting or not. This flag is only true
 * while the multi-selection is being selected (by mouse move), and is false
 * once the multi-selection has been settled.
 *
 * @see hasMultiSelection
 *
 * @return {boolean} True if multi-selecting, false if not.
 */
export const isMultiSelecting = createAtomSelector( () => ( { get } ) => {
	return get( isMultiSelectingAtom );
} );

/**
 * Selector that returns if multi-selection is enabled or not.
 *
 * @return {boolean} True if it should be possible to multi-select blocks, false if multi-selection is disabled.
 */
export const isSelectionEnabled = createAtomSelector( () => ( { get } ) => {
	return get( isSelectionEnabledAtom );
} );

/**
 * Returns the block's editing mode, defaulting to "visual" if not explicitly
 * assigned.
 *
 * @return {Object} Block editing mode.
 */
export const getBlockMode = createAtomSelector( ( clientId ) => ( { get } ) => {
	return get( blocksModeByClientId )[ clientId ] || 'visual';
} );

/**
 * Returns true if the user is typing, or false otherwise.
 *
 * @return {boolean} Whether user is typing.
 */
export const isTyping = createAtomSelector( () => ( { get } ) => {
	return get( isTypingAtom );
} );

/**
 * Returns true if the user is dragging blocks, or false otherwise.
 *
 * @return {boolean} Whether user is dragging blocks.
 */
export const isDraggingBlocks = createAtomSelector( () => ( { get } ) => {
	return !! get( draggedBlocks ).length;
} );

/**
 * Returns the client ids of any blocks being directly dragged.
 *
 * This does not include children of a parent being dragged.
 *
 * @return {string[]} Array of dragged block client ids.
 */
export const getDraggedBlockClientIds = createAtomSelector(
	() => ( { get } ) => {
		return get( draggedBlocks );
	}
);

/**
 * Returns whether the block is being dragged.
 *
 * Only returns true if the block is being directly dragged,
 * not if the block is a child of a parent being dragged.
 * See `isAncestorBeingDragged` for child blocks.
 *
 * @param {string} clientId Client id for block to check.
 *
 * @return {boolean} Whether the block is being dragged.
 */
export const isBlockBeingDragged = createAtomSelector(
	( clientId ) => ( { get } ) => {
		return get( draggedBlocks ).includes( clientId );
	}
);

/**
 * Returns whether a parent/ancestor of the block is being dragged.
 *
 * @param {string} clientId Client id for block to check.
 *
 * @return {boolean} Whether the block's ancestor is being dragged.
 */
export const isAncestorBeingDragged = createAtomSelector(
	( clientId ) => ( { get } ) => {
		// Return early if no blocks are being dragged rather than
		// the more expensive check for parents.
		if ( ! get( isDraggingBlocks() ) ) {
			return false;
		}

		const parents = get( getBlockParents( clientId ) );
		return some( parents, ( parentClientId ) =>
			get( isBlockBeingDragged( parentClientId ) )
		);
	}
);

/**
 * Returns true if the caret is within formatted text, or false otherwise.
 *
 * @return {boolean} Whether the caret is within formatted text.
 */
export const isCaretWithinFormattedText = createAtomSelector(
	() => ( { get } ) => {
		return get( isCaretWithinFormattedTextAtom );
	}
);

/**
 * Returns the insertion point. This will be:
 *
 * 1) The insertion point manually set using setInsertionPoint() or
 *    showInsertionPoint(); or
 * 2) The point after the current block selection, if there is a selection; or
 * 3) The point at the end of the block list.
 *
 * Components like <Inserter> will default to inserting blocks at this point.
 *
 * @return {Object} Insertion point object with `rootClientId` and `index`.
 */
export const getBlockInsertionPoint = createAtomSelector( () => ( { get } ) => {
	const insertionPoint = get( insertionPointAtom );
	if ( insertionPoint !== null ) {
		return insertionPoint;
	}

	let rootClientId, index;
	const { clientId } = get( selectionEnd );

	if ( clientId ) {
		rootClientId = get( getBlockRootClientId( clientId ) ) || undefined;
		index = get( getBlockIndex( clientId, rootClientId ) ) + 1;
	} else {
		index = get( getBlockOrder() ).length;
	}

	return { rootClientId, index };
} );

/**
 * Whether or not the insertion point should be shown to users. This is set
 * using showInsertionPoint() or hideInsertionPoint().
 *
 * @return {?boolean} Whether the insertion point should be shown.
 */
export const isBlockInsertionPointVisible = createAtomSelector(
	() => ( { get } ) => {
		return get( insertionPointVisibility );
	}
);

/**
 * Returns whether the blocks matches the template or not.
 *
 * @return {?boolean} Whether the template is valid or not.
 */
export const isValidTemplate = createAtomSelector( () => ( { get } ) => {
	return get( template ).isValid;
} );

/**
 * Returns the defined block template
 *
 * @return {?Array}        Block Template
 */
export const getTemplate = createAtomSelector( () => ( { get } ) => {
	return get( settings ).template;
} );

/**
 * Returns the defined block template lock. Optionally accepts a root block
 * client ID as context, otherwise defaulting to the global context.
 *
 * @param {?string} rootClientId Optional block root client ID.
 *
 * @return {?string} Block Template Lock
 */
export const getTemplateLock = createAtomSelector(
	( rootClientId ) => ( { get } ) => {
		if ( ! rootClientId ) {
			return get( settings ).templateLock;
		}

		const blockListSettings = get( getBlockListSettings( rootClientId ) );
		if ( ! blockListSettings ) {
			return null;
		}

		return blockListSettings.templateLock;
	}
);

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
const canInsertBlockTypeUnmemoized = ( blockName, rootClientId = null ) => ( {
	get,
} ) => {
	const checkAllowList = ( list, item, defaultResult = null ) => {
		if ( isBoolean( list ) ) {
			return list;
		}
		if ( isArray( list ) ) {
			// TODO: when there is a canonical way to detect that we are editing a post
			// the following check should be changed to something like:
			// if ( list.includes( 'core/post-content' ) && getEditorMode() === 'post-content' && item === null )
			if ( list.includes( 'core/post-content' ) && item === null ) {
				return true;
			}
			return list.includes( item );
		}
		return defaultResult;
	};

	const blockType = getBlockType( blockName );
	if ( ! blockType ) {
		return false;
	}

	const { allowedBlockTypes } = get( settings );

	const isBlockAllowedInEditor = checkAllowList(
		allowedBlockTypes,
		blockName,
		true
	);
	if ( ! isBlockAllowedInEditor ) {
		return false;
	}

	const isLocked = !! get( getTemplateLock( rootClientId ) );
	if ( isLocked ) {
		return false;
	}

	const parentBlockListSettings = get( getBlockListSettings( rootClientId ) );

	// The parent block doesn't have settings indicating it doesn't support
	// inner blocks, return false.
	if ( rootClientId && parentBlockListSettings === undefined ) {
		return false;
	}

	const parentAllowedBlocks = parentBlockListSettings?.allowedBlocks;
	const hasParentAllowedBlock = checkAllowList(
		parentAllowedBlocks,
		blockName
	);

	const blockAllowedParentBlocks = blockType.parent;
	const parentName = get( getBlockName( rootClientId ) );
	const hasBlockAllowedParent = checkAllowList(
		blockAllowedParentBlocks,
		parentName
	);

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
 * @param {string}  blockName    The name of the block type, e.g.' core/paragraph'.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {boolean} Whether the given block type is allowed to be inserted.
 */
export const canInsertBlockType = createAtomSelector(
	canInsertBlockTypeUnmemoized
);

/**
 * Determines if the given blocks are allowed to be inserted into the block
 * list.
 *
 * @param {string}  clientIds    The block client IDs to be inserted.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {boolean} Whether the given blocks are allowed to be inserted.
 */
export const canInsertBlocks = createAtomSelector(
	( clientIds, rootClientId = null ) => ( { get } ) => {
		return clientIds.every( ( id ) =>
			get( canInsertBlockType( get( getBlockName( id ) ), rootClientId ) )
		);
	}
);

/**
 * Returns information about how recently and frequently a block has been inserted.
 *
 * @param {string} id    A string which identifies the insert, e.g. 'core/block/12'
 *
 * @return {?{ time: number, count: number }} An object containing `time` which is when the last
 *                                            insert occurred as a UNIX epoch, and `count` which is
 *                                            the number of inserts that have occurred.
 */
const getInsertUsage = ( id ) => ( { get } ) => {
	return get( preferences ).insertUsage?.[ id ] ?? null;
};

/**
 * Returns whether we can show a block type in the inserter
 *
 * @param {Object} blockType BlockType
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {boolean} Whether the given block type is allowed to be shown in the inserter.
 */
const canIncludeBlockTypeInInserter = ( blockType, rootClientId ) => ( {
	get,
} ) => {
	if ( ! hasBlockSupport( blockType, 'inserter', true ) ) {
		return false;
	}

	return canInsertBlockTypeUnmemoized(
		blockType.name,
		rootClientId
	)( { get } );
};

/**
 * Return a function to be used to tranform a block variation to an inserter item
 *
 * @param {Object} item Denormalized inserter item
 * @return {Function} Function to transform a block variation to inserter item
 */
const getItemFromVariation = ( item ) => ( variation ) => ( {
	...item,
	id: `${ item.id }-${ variation.name }`,
	icon: variation.icon || item.icon,
	title: variation.title || item.title,
	description: variation.description || item.description,
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
} );

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
 * @param {?string} rootClientId Optional root client ID of block list.
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
export const getInserterItems = createAtomSelector(
	( rootClientId = null ) => ( { get } ) => {
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
				isDisabled = some(
					get(
						getBlocksByClientId(
							get( getClientIdsWithDescendants() )
						)
					),
					{
						name: blockType.name,
					}
				);
			}

			const { time, count = 0 } = getInsertUsage( id )( { get } ) || {};
			const inserterVariations = blockType.variations.filter(
				( { scope } ) => ! scope || scope.includes( 'inserter' )
			);

			return {
				id,
				name: blockType.name,
				initialAttributes: {},
				title: blockType.title,
				description: blockType.description,
				icon: blockType.icon,
				category: blockType.category,
				keywords: blockType.keywords,
				variations: inserterVariations,
				example: blockType.example,
				isDisabled,
				utility: 1, // deprecated
				frecency: calculateFrecency( time, count ),
			};
		};

		const buildReusableBlockInserterItem = ( reusableBlock ) => {
			const id = `core/block/${ reusableBlock.id }`;

			const referencedBlocks = get(
				__experimentalGetParsedReusableBlock( reusableBlock.id )
			);
			let referencedBlockType;
			if ( referencedBlocks.length === 1 ) {
				referencedBlockType = getBlockType(
					referencedBlocks[ 0 ].name
				);
			}

			const { time, count = 0 } = getInsertUsage( id )( { get } ) || {};
			const frecency = calculateFrecency( time, count );

			return {
				id,
				name: 'core/block',
				initialAttributes: { ref: reusableBlock.id },
				title: reusableBlock.title.raw,
				icon: referencedBlockType
					? referencedBlockType.icon
					: templateIcon,
				category: 'reusable',
				keywords: [],
				isDisabled: false,
				utility: 1, // deprecated
				frecency,
			};
		};

		const blockTypeInserterItems = getBlockTypes()
			.filter( ( blockType ) =>
				canIncludeBlockTypeInInserter(
					blockType,
					rootClientId
				)( { get } )
			)
			.map( buildBlockTypeInserterItem );

		const reusableBlockInserterItems = canInsertBlockTypeUnmemoized(
			'core/block',
			rootClientId
		)( { get } )
			? get( getReusableBlocks() ).map( buildReusableBlockInserterItem )
			: [];

		// Exclude any block type item that is to be replaced by a default
		// variation.
		const visibleBlockTypeInserterItems = blockTypeInserterItems.filter(
			( { variations = [] } ) =>
				! variations.some( ( { isDefault } ) => isDefault )
		);

		const blockVariations = [];
		// Show all available blocks with variations
		for ( const item of blockTypeInserterItems ) {
			const { variations = [] } = item;
			if ( variations.length ) {
				const variationMapper = getItemFromVariation( item );
				blockVariations.push( ...variations.map( variationMapper ) );
			}
		}

		return [
			...visibleBlockTypeInserterItems,
			...blockVariations,
			...reusableBlockInserterItems,
		];
	}
);

/**
 * Determines whether there are items to show in the inserter.
 *
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {boolean} Items that appear in inserter.
 */
export const hasInserterItems = createAtomSelector(
	( state, rootClientId = null ) => ( { get } ) => {
		const hasBlockType = some( getBlockTypes(), ( blockType ) =>
			canIncludeBlockTypeInInserter( blockType, rootClientId )( { get } )
		);
		if ( hasBlockType ) {
			return true;
		}
		const hasReusableBlock =
			canInsertBlockTypeUnmemoized(
				'core/block',
				rootClientId
			)( { get } ) && get( getReusableBlocks() ).length > 0;

		return hasReusableBlock;
	}
);

/**
 * Returns the list of allowed inserter blocks for inner blocks children
 *
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {Array?} The list of allowed block types.
 */
export const __experimentalGetAllowedBlocks = createAtomSelector(
	( state, rootClientId = null ) => ( { get } ) => {
		if ( ! rootClientId ) {
			return;
		}

		return filter( getBlockTypes(), ( blockType ) =>
			canIncludeBlockTypeInInserter( blockType, rootClientId )( { get } )
		);
	}
);

/**
 * Returns the Block List settings of a block, if any exist.
 *
 * @param {?string} clientId Block client ID.
 *
 * @return {?Object} Block settings of the block if set.
 */
export const getBlockListSettings = createAtomSelector(
	( clientId ) => ( { get } ) => {
		return get( blockListSettingsByClientId )[ clientId ];
	}
);

/**
 * Returns the editor settings.
 *
 * @return {Object} The editor settings object.
 */
export const getSettings = createAtomSelector( () => ( { get } ) => {
	return get( settings );
} );

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
 * Returns the Block List settings for an array of blocks, if any exist.
 *
 * @param {Object}  state    Editor state.
 * @param {Array} clientIds Block client IDs.
 *
 * @return {Array} Block List Settings for each of the found blocks
 */
export const __experimentalGetBlockListSettingsForBlocks = createAtomSelector(
	( clientIds ) => ( { get } ) => {
		return filter( get( blockListSettingsByClientId ), ( value, key ) =>
			clientIds.includes( key )
		);
	}
);

/**
 * Returns the parsed block saved as shared block with the given ID.
 *
 * @param {number|string} ref   The shared block's ID.
 *
 * @return {Object} The parsed block.
 */
export const __experimentalGetParsedReusableBlock = createAtomSelector(
	( ref ) => ( { get } ) => {
		const reusableBlock = find(
			get( getReusableBlocks() ),
			( block ) => block.id === ref
		);
		if ( ! reusableBlock ) {
			return null;
		}

		// Only reusableBlock.content.raw should be used here, `reusableBlock.content` is a
		// workaround until #22127 is fixed.
		return parse(
			typeof reusableBlock.content.raw === 'string'
				? reusableBlock.content.raw
				: reusableBlock.content
		);
	}
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
 * Returns the available reusable blocks
 *
 * @return {Array} Reusable blocks
 */
const getReusableBlocks = createAtomSelector( () => ( { get } ) => {
	return get( settings ).__experimentalReusableBlocks ?? EMPTY_ARRAY;
} );

/**
 * Returns whether the navigation mode is enabled.
 *
 * @return {boolean}     Is navigation mode enabled.
 */
export const isNavigationMode = createAtomSelector( () => ( { get } ) => {
	return get( isNavigationModeAtom );
} );

/**
 * Returns whether block moving mode is enabled.
 *
 * @return {string}     Client Id of moving block.
 */
export const hasBlockMovingClientId = createAtomSelector( () => ( { get } ) => {
	return get( hasBlockMovingClientIdAtom );
} );

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
 * @param {string} clientId The block to check.
 *
 * @return {boolean} Whether the block is currently highlighted.
 */
export const isBlockHighlighted = createAtomSelector(
	( clientId ) => ( { get } ) => {
		return get( highlightedBlock ) === clientId;
	}
);

/**
 * Checks if a given block has controlled inner blocks.
 *
 * @param {string} clientId The block to check.
 *
 * @return {boolean} True if the block has controlled inner blocks.
 */
export const areInnerBlocksControlled = createAtomSelector(
	( clientId ) => ( { get } ) => {
		return !! get( controlledInnerBlocks )[ clientId ];
	}
);

/**
 * Returns the clientId for the first 'active' block of a given array of block names.
 * A block is 'active' if it (or a child) is the selected block.
 * Returns the first match moving up the DOM from the selected block.
 *
 * @param {string[]} validBlocksNames The names of block types to check for.
 *
 * @return {string} The matching block's clientId.
 */
export const __experimentalGetActiveBlockIdByBlockNames = createAtomSelector(
	( validBlockNames ) => ( { get } ) => {
		if ( ! validBlockNames.length ) {
			return null;
		}
		// Check if selected block is a valid entity area.
		const selectedBlockClientId = get( getSelectedBlockClientId() );
		if (
			validBlockNames.includes(
				get( getBlockName( selectedBlockClientId ) )
			)
		) {
			return selectedBlockClientId;
		}
		// Check if first selected block is a child of a valid entity area.
		const multiSelectedBlockClientIds = get(
			getMultiSelectedBlockClientIds()
		);
		const entityAreaParents = get(
			getBlockParentsByBlockName(
				selectedBlockClientId || multiSelectedBlockClientIds[ 0 ],
				validBlockNames
			)
		);
		if ( entityAreaParents ) {
			// Last parent closest/most interior.
			return last( entityAreaParents );
		}
		return null;
	}
);
