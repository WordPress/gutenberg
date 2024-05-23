/**
 * Internal dependencies
 */
import { getBlockVariations, getBlockType } from '../registration';

/**
 * Convert alias blocks to their canonical form. This function is used
 * at the parser level for previous content.
 *
 * @param {string} name The block's name, possibly with a variation suffix.
 *
 * @return {string} The block's canonical name, with the variation suffix removed.
 */
export function stripBlockVariationSuffixFromBlockName( name ) {
	const blockVariation = name.split( '/' )?.[ 2 ];
	if ( blockVariation ) {
		return name.replace( `/${ blockVariation }`, '' );
		// const variations = getBlockVariations( canonicalBlockName );
		// TODO: Validate. (Check if variation exists in variations array.)
	}
	return name;
}
