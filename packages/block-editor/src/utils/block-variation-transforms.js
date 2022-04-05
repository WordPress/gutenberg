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
 * If a variation provides an `isActive` function, this is used to check whether or not
 * there is a matching variation, falling back to a simple comparison between the
 * block's attributes and the variation's attributes.
 *
 * @param {Object}             blockAttributes - The block attributes to try to find a match.
 * @param {WPBlockVariation[]} variations      - A list of block variations to test for a match.
 * @return {?WPBlockVariation} - If a match is found returns it. If not or more than one matches are found returns `undefined`.
 */
export const __experimentalGetMatchingVariation = (
	blockAttributes,
	variations
) => {
	if ( ! variations || ! blockAttributes ) {
		return;
	}

	const matches = variations.filter( ( { attributes, isActive } ) => {
		if ( ! attributes || ! Object.keys( attributes ).length ) {
			return false;
		}

		// If an `isActive` function is provided for the variation, use this to determine
		// whether or not there is a match, as some variations involve more logic than a
		// simple match between the block's attributes and the variation's attributes.
		if ( typeof isActive === 'function' ) {
			if ( isActive( blockAttributes ) ) {
				return true;
			}
			return false;
		}

		// If no `isActive` function is provided, match the block attributes against
		// the variation's attributes.
		return isMatch( blockAttributes, attributes );
	} );

	if ( matches.length !== 1 ) {
		return;
	}

	return matches[ 0 ];
};
