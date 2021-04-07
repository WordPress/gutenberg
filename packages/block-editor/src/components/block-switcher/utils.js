/**
 * WordPress dependencies
 */
import { __experimentalGetBlockAttributesNamesByRole as getBlockAttributesNamesByRole } from '@wordpress/blocks';
/**
 * Find a selected block match in a pattern and return it.
 * We return a reference to the block object to mutate it.
 * We have first cloned the pattern blocks in a new property
 * `transformedBlocks` and we mutate this.
 *
 * @param {WPBlock} block The pattern's block to try to find a match.
 * @param {string} selectedBlockName The current selected block's name.
 * @param {Set} consumedBlocks A set holding the previously matched blocks.
 *
 * @return {WPBlock?} The matched block if found or `false`.
 */
// TODO tests
export const getMatchingBlockInPattern = (
	block,
	selectedBlockName,
	consumedBlocks
) => {
	const { clientId, name, innerBlocks = [] } = block;
	/**
	 * Check if block has been transformed already.
	 * This is needed because we loop the selected blocks
	 * and for example we may have selected two paragraphs and
	 * the patterns could have more `paragraphs`.
	 */
	if ( consumedBlocks.has( clientId ) ) return;
	if ( name === selectedBlockName ) return block;
	// Try to find a matching block from InnerBlocks.
	for ( const innerBlock of innerBlocks ) {
		const match = getMatchingBlockInPattern(
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
 * @param {string} name Block type's namespaced name.
 * @param {Object} attributes Selected block's attributes.
 * @return {Object} The block's attributes to retain.
 */
export const getBlockRetainingAttributes = ( name, attributes ) => {
	const contentAttributes = getBlockAttributesNamesByRole( name, 'content' );
	if ( ! contentAttributes?.length ) return attributes;

	return contentAttributes.reduce( ( _accumulator, attribute ) => {
		if ( attributes[ attribute ] )
			_accumulator[ attribute ] = attributes[ attribute ];
		return _accumulator;
	}, {} );
};
