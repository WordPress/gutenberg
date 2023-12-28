/**
 * WordPress dependencies
 */
import { __experimentalGetBlockAttributesNamesByRole as getBlockAttributesNamesByRole } from '@wordpress/blocks';

/**
 * Try to find a matching block by a block's name in a provided
 * block. We recurse through InnerBlocks and return the reference
 * of the matched block (it could be an InnerBlock).
 * If no match is found return nothing.
 *
 * @param {WPBlock} block             The block to try to find a match.
 * @param {string}  selectedBlockName The block's name to use for matching condition.
 * @param {Set}     consumedBlocks    A set holding the previously matched/consumed blocks.
 *
 * @return {WPBlock | undefined} The matched block if found or nothing(`undefined`).
 */
export const getMatchingBlockByName = (
	block,
	selectedBlockName,
	consumedBlocks = new Set()
) => {
	const { clientId, name, innerBlocks = [] } = block;
	// Check if block has been consumed already.
	if ( consumedBlocks.has( clientId ) ) return;
	if ( name === selectedBlockName ) return block;
	// Try to find a matching block from InnerBlocks recursively.
	for ( const innerBlock of innerBlocks ) {
		const match = getMatchingBlockByName(
			innerBlock,
			selectedBlockName,
			consumedBlocks
		);
		if ( match ) return match;
	}
};

/**
 * Find and return the block attributes to retain through
 * the transformation, based on Block Type's `role:content`
 * attributes. If no `role:content` attributes exist,
 * return selected block's attributes.
 *
 * @param {string} name       Block type's namespaced name.
 * @param {Object} attributes Selected block's attributes.
 * @return {Object} The block's attributes to retain.
 */
export const getRetainedBlockAttributes = ( name, attributes ) => {
	const contentAttributes = getBlockAttributesNamesByRole( name, 'content' );
	if ( ! contentAttributes?.length ) return attributes;

	return contentAttributes.reduce( ( _accumulator, attribute ) => {
		if ( attributes[ attribute ] )
			_accumulator[ attribute ] = attributes[ attribute ];
		return _accumulator;
	}, {} );
};
