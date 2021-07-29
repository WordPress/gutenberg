/**
 * External dependencies
 */
import { isArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

export const getBlockPositionDescription = ( position, siblingCount, level ) =>
	sprintf(
		/* translators: 1: The numerical position of the block. 2: The total number of blocks. 3. The level of nesting for the block. */
		__( 'Block %1$d of %2$d, Level %3$d' ),
		position,
		siblingCount,
		level
	);

/**
 * Returns true if the client ID occurs within the block selection or multi-selection,
 * or false otherwise.
 *
 * @param {string}          clientId               Block client ID.
 * @param {string|string[]} selectedBlockClientIds Selected block client ID, or an array of multi-selected blocks client IDs.
 *
 * @return {boolean} Whether the block is in multi-selection set.
 */
export const isClientIdSelected = ( clientId, selectedBlockClientIds ) =>
	isArray( selectedBlockClientIds ) && selectedBlockClientIds.length
		? selectedBlockClientIds.indexOf( clientId ) !== -1
		: selectedBlockClientIds === clientId;

/**
 * A slimmed down representation of a block.
 *
 * @typedef {Object} WPListViewBlock
 *
 * @property { string }            clientId    block clientId
 * @property { WPListViewBlock[] } innerBlocks any nested child blocks
 */

/**
 * Returns a new tree and the affected parentId with the matching block removed. This does not mutate
 * the passed tree.
 *
 * @param { WPListViewBlock[] } tree       The current block tree to deep copy
 * @param { string }            id         Block clientId to remove
 * @param { string }            [parentId] The current parent id for a given level. Root is ''
 *
 * @return { { newTree: WPListViewBlock[], removeParentId: string } }  Return a new tree with the block removed and the affected parentId.
 */
export function removeItemFromTree( tree, id, parentId = '' ) {
	const newTree = [];
	let removeParentId = '';
	for ( let index = 0; index < tree.length; index++ ) {
		const block = tree[ index ];
		if ( block.clientId !== id ) {
			if ( block.innerBlocks.length > 0 ) {
				const {
					newTree: innerBlocks,
					removeParentId: cRemoveParentId,
				} = removeItemFromTree( block.innerBlocks, id, block.clientId );
				newTree.push( {
					...block,
					innerBlocks,
				} );
				removeParentId =
					cRemoveParentId !== '' ? cRemoveParentId : removeParentId;
			} else {
				newTree.push( { ...block } );
			}
		} else {
			removeParentId = parentId;
		}
	}
	return { newTree, removeParentId };
}
/**
 * Returns a new tree with a block added as a sibling to the target id. This does not mutate the passed tree.
 *
 * @param { WPListViewBlock[] } tree          The current block tree to deep copy
 * @param { string }            id            Block clientId to add a sibling block to
 * @param { WPListViewBlock }   item          Block to add
 * @param { boolean }           [insertAfter] If we should insert the block before or after the target block.
 * @param { string }            [parentId]    The current parent id for a given level. Root is ''
 *
 * @return { { newTree: WPListViewBlock[], targetId: string, targetIndex: number } }  Return a new tree with the item added and the affected parentId and index.
 */
export function addItemToTree(
	tree,
	id,
	item,
	insertAfter = true,
	parentId = ''
) {
	const newTree = [];
	let targetIndex = -1;
	let targetId = '';
	for ( let index = 0; index < tree.length; index++ ) {
		const block = tree[ index ];
		if ( block.clientId === id ) {
			targetId = parentId;
			if ( insertAfter ) {
				targetIndex = newTree.length + 1;
				newTree.push( { ...block } );
				newTree.push( { ...item } );
			} else {
				targetIndex = newTree.length;
				newTree.push( { ...item } );
				newTree.push( { ...block } );
			}
		} else if ( block.clientId !== id ) {
			if ( block.innerBlocks.length > 0 ) {
				const {
					newTree: innerBlocks,
					targetIndex: childTargetIndex,
					targetId: childTargetId,
				} = addItemToTree(
					block.innerBlocks,
					id,
					item,
					insertAfter,
					block.clientId
				);
				newTree.push( {
					...block,
					innerBlocks,
				} );
				targetIndex = Math.max( targetIndex, childTargetIndex );
				targetId = childTargetId !== '' ? childTargetId : targetId;
			} else {
				newTree.push( { ...block } );
			}
		}
	}
	return { newTree, targetId, targetIndex };
}

/**
 * Returns a new tree with a block added as a child to the target id. This does not mutate the passed tree.
 *
 * @param { WPListViewBlock[] } tree The current block tree to deep copy
 * @param { string }            id   Block clientId to add a child block to
 * @param { WPListViewBlock }   item Block to add
 *
 * @return { WPListViewBlock[] }  Returns a new tree with the child item added
 */
export function addChildItemToTree( tree, id, item ) {
	const newTree = [];
	for ( let index = 0; index < tree.length; index++ ) {
		const block = tree[ index ];
		if ( block.clientId === id ) {
			block.innerBlocks = [ item, ...block.innerBlocks ];
			newTree.push( block );
		} else if ( block.clientId !== id ) {
			if ( block.innerBlocks.length > 0 ) {
				newTree.push( {
					...block,
					innerBlocks: addChildItemToTree(
						block.innerBlocks,
						id,
						item
					),
				} );
			} else {
				newTree.push( { ...block } );
			}
		}
	}
	return newTree;
}

/**
 * Block information used for determining drag targets. This is set in block.js
 *
 * @typedef {Object} WPListViewPosition
 *
 * @property { string }  clientId      block clientId
 * @property { boolean } dropContainer true, if the currently dragged item may be added as a child
 * @property { boolean } dropSibling   true, if the currently dragged item may be added as a sibling
 * @property { string }  parentId      parent clientId
 * @property { boolean } isLastChild   true, if block is last item of innerBlocks
 */

/**
 * Returns the first valid sibling of the currently dragged item if we can find if any.
 *
 * @param { Object.< number, WPListViewPosition > } positions
 * @param { number }                                current   the flat list index of the dragged item
 * @param { number }                                velocity  mouse velocity
 *
 * @return { [ WPListViewPosition | null , number | null ] }  The first valid sibling position and index.
 */
export function findFirstValidSibling( positions, current, velocity ) {
	const iterate = velocity > 0 ? 1 : -1;
	let index = current + iterate;
	const currentPosition = positions[ current ];
	while ( positions[ index ] !== undefined ) {
		const position = positions[ index ];
		if (
			position.dropSibling &&
			position.parentId === currentPosition.parentId
		) {
			return [ position, index ];
		}
		index += iterate;
	}
	return [ null, null ];
}
