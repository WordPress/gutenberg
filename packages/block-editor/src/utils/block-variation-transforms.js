/**
 * External dependencies
 */
import { isMatch } from 'lodash';

/** @typedef {import('@wordpress/blocks').WPBlockVariation} WPBlockVariation */

/**
 * Matches the provided block variations with a block's attributes. If no match
 * or more than one matches are found it returns `undefined`. If a single match is
 * found it returns it.
 *
 * This is a simple implementation for now as it takes into account only the attributes
 * of a block variation and not `InnerBlocks`.
 *
 * @param {Object} blockAttributes - The block attributes to try to find a match.
 * @param {WPBlockVariation[]} variations - A list of block variations to test for a match.
 * @return {?WPBlockVariation} - If a match is found returns it. If not or more than one matches are found returns `undefined`.
 */
export const __experimentalGetMatchingVariation = (
	blockAttributes,
	variations
) => {
	if ( ! variations || ! blockAttributes ) return;
	const matches = variations.filter( ( { attributes } ) => {
		if ( ! attributes || ! Object.keys( attributes ).length ) return false;
		return isMatch( blockAttributes, attributes );
	} );
	if ( matches.length !== 1 ) return;
	return matches[ 0 ];
};
