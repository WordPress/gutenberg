/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { cloneBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getMatchingBlockByName, getRetainedBlockAttributes } from './utils';

/**
 * Mutate the matched block's attributes by getting
 * which block type's attributes to retain and prioritize
 * them in the merging of the attributes.
 *
 * @param {WPBlock} match         The matched block.
 * @param {WPBlock} selectedBlock The selected block.
 * @return {void}
 */
export const transformMatchingBlock = ( match, selectedBlock ) => {
	// Get the block attributes to retain through the transformation.
	const retainedBlockAttributes = getRetainedBlockAttributes(
		selectedBlock.name,
		selectedBlock.attributes
	);
	match.attributes = {
		...match.attributes,
		...retainedBlockAttributes,
	};
};

/**
 * By providing the selected blocks and pattern's blocks
 * find the matching blocks, transform them and return them.
 * If not all selected blocks are matched, return nothing.
 *
 * @param {WPBlock[]} selectedBlocks The selected blocks.
 * @param {WPBlock[]} patternBlocks  The pattern's blocks.
 * @return {WPBlock[]|void} The transformed pattern's blocks or undefined if not all selected blocks have been matched.
 */
export const getPatternTransformedBlocks = (
	selectedBlocks,
	patternBlocks
) => {
	// Clone Pattern's blocks to produce new clientIds and be able to mutate the matches.
	const _patternBlocks = patternBlocks.map( ( block ) =>
		cloneBlock( block )
	);
	/**
	 * Keep track of the consumed pattern blocks.
	 * This is needed because we loop the selected blocks
	 * and for example we may have selected two paragraphs and
	 * the pattern's blocks could have more `paragraphs`.
	 */
	const consumedBlocks = new Set();
	for ( const selectedBlock of selectedBlocks ) {
		let isMatch = false;
		for ( const patternBlock of _patternBlocks ) {
			const match = getMatchingBlockByName(
				patternBlock,
				selectedBlock.name,
				consumedBlocks
			);
			if ( ! match ) {
				continue;
			}
			isMatch = true;
			consumedBlocks.add( match.clientId );
			// We update (mutate) the matching pattern block.
			transformMatchingBlock( match, selectedBlock );
			// No need to loop through other pattern's blocks.
			break;
		}
		// Bail early if a selected block has not been matched.
		if ( ! isMatch ) {
			return;
		}
	}
	return _patternBlocks;
};

/**
 * @typedef {WPBlockPattern & {transformedBlocks: WPBlock[]}} TransformedBlockPattern
 */

/**
 * Custom hook that accepts patterns from state and the selected
 * blocks and tries to match these with the pattern's blocks.
 * If all selected blocks are matched with a Pattern's block,
 * we transform them by retaining block's attributes with `role:content`.
 * The transformed pattern's blocks are set to a new pattern
 * property `transformedBlocks`.
 *
 * @param {WPBlockPattern[]} patterns       Patterns from state.
 * @param {WPBlock[]}        selectedBlocks The currently selected blocks.
 * @return {TransformedBlockPattern[]} Returns the eligible matched patterns with all the selected blocks.
 */
const useTransformedPatterns = ( patterns, selectedBlocks ) => {
	return useMemo(
		() =>
			patterns.reduce( ( accumulator, _pattern ) => {
				const transformedBlocks = getPatternTransformedBlocks(
					selectedBlocks,
					_pattern.blocks
				);
				if ( transformedBlocks ) {
					accumulator.push( {
						..._pattern,
						transformedBlocks,
					} );
				}
				return accumulator;
			}, [] ),
		[ patterns, selectedBlocks ]
	);
};

export default useTransformedPatterns;
