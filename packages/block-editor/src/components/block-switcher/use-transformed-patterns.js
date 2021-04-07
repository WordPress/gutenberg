/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { cloneBlock } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import {
	getMatchingBlockInPattern,
	getBlockRetainingAttributes,
} from './utils';

/**
 *
 * @param {WPBlock[]} selectedBlocks The selected blocks.
 * @param {WPBlock[]} patternBlocks The pattern's blocks.
 * @return {WPBlock[]|void} The transformed pattern's blocks or undefined if not all selected blocks have been matched.
 */
// TODO jsdoc
// TODO tests
const getPatternTransformedBlocks = ( selectedBlocks, patternBlocks ) => {
	// const eligiblePattern = getEligiblePattern()
	// Clone Pattern's blocks in `transformedBlocks` prop, to mutate them.
	const _patternBlocks = patternBlocks.map( ( block ) =>
		cloneBlock( block )
	);
	const consumedBlocks = new Set();
	for ( const selectedBlock of selectedBlocks ) {
		let isMatch = false;
		for ( const patternBlock of _patternBlocks ) {
			const match = getMatchingBlockInPattern(
				patternBlock,
				selectedBlock.name,
				consumedBlocks
			);
			if ( ! match ) continue;
			isMatch = true;
			consumedBlocks.add( match.clientId );
			// We update (mutate) the matching pattern block.
			transformMatchingBlock( match, selectedBlock );
			break;
		}
		// Bail eary if a selected block has not been matched.
		if ( ! isMatch ) return;
	}
	return _patternBlocks;
};
// here goes the mutation... :)
const transformMatchingBlock = ( match, selectedBlock ) => {
	// Get the block attributes to retain through the transformation.
	const retainedBlockAttributes = getBlockRetainingAttributes(
		selectedBlock.name,
		selectedBlock.attributes
	);
	match.attributes = {
		...match.attributes,
		...retainedBlockAttributes,
	};
};

/**
 * Custom hook that accepts patterns from state and the selected
 * blocks and tries to match these with the pattern's blocks.
 * If all selected blocks are matched with a Pattern's block,
 * we transform them by retaining block's attributes with `role:content`.
 * The transformed pattern's blocks are set to a new pattern
 * property `transformedBlocks`.
 *
 * @param {WPBlockPattern[]} patterns Patterns from state.
 * @param {WPBlock[]} selectedBlocks The currently selected blocks.
 * @return {WPBlockPattern[]} Returns the eligible matched patterns with all the selected blocks.
 */
const useTransformedPatterns = ( patterns, selectedBlocks ) => {
	return useMemo( () => {
		const _patterns = patterns.reduce( ( accumulator, _pattern ) => {
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
		}, [] );
		return _patterns;
	}, [ patterns, selectedBlocks ] );
};

export default useTransformedPatterns;
