import { getBlockAttributesNamesByRole } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';

/**
 * Try to find a matching block by a block's name in a provided
 * block. We recurse through InnerBlocks and return the reference
 * of the matched block (it could be an InnerBlock).
 * If no match is found return nothing.
 *
 * @param block             The block to try to find a match.
 * @param selectedBlockName The block's name to use for matching condition.
 * @param consumedBlocks    A set holding the previously matched/consumed blocks.
 *
 * @return The matched block if found or nothing(`undefined`).
 */
export const getMatchingBlockByName = (
	block: Block,
	selectedBlockName: string,
	consumedBlocks: Set< string > = new Set()
): Block | void => {
	const { clientId, name, innerBlocks = [] } = block;
	// Check if block has been consumed already.
	if ( consumedBlocks.has( clientId ) ) {
		return;
	}
	if ( name === selectedBlockName ) {
		return block;
	}
	// Try to find a matching block from InnerBlocks recursively.
	for ( const innerBlock of innerBlocks ) {
		const match = getMatchingBlockByName(
			innerBlock,
			selectedBlockName,
			consumedBlocks
		);
		if ( match ) {
			return match;
		}
	}
};

/**
 * Find and return the block attributes to retain through
 * the transformation, based on Block Type's `role:content`
 * attributes. If no `role:content` attributes exist,
 * return selected block's attributes.
 *
 * @param name       Block type's namespaced name.
 * @param attributes Selected block's attributes.
 * @return The block's attributes to retain.
 */
export const getRetainedBlockAttributes = (
	name: string,
	attributes: Record< string, unknown >
): Record< string, unknown > => {
	const contentAttributes = getBlockAttributesNamesByRole( name, 'content' );
	if ( ! contentAttributes?.length ) {
		return attributes;
	}

	return contentAttributes.reduce< Record< string, unknown > >(
		( _accumulator, attribute ) => {
			if ( attributes[ attribute ] ) {
				_accumulator[ attribute ] = attributes[ attribute ];
			}
			return _accumulator;
		},
		{}
	);
};
