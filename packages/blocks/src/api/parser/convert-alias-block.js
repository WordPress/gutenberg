/**
 * Internal dependencies
 */
import { getBlockVariations } from '../registration';

/**
 * Convert alias blocks to their canonical form. This function is used
 * at the parser level for previous content.
 *
 * @param {string} name The block's name, possibly with a variation suffix.
 *
 * @return {string} The block's canonical name, with the variation suffix removed.
 */
export function stripBlockVariationSuffixFromBlockName( name ) {
	const blockNameParts = name.split( '/' );

	if ( blockNameParts.length > 2 || blockNameParts[ 0 ] === 'core' ) {
		// We're dealing with a block with a variation (e.g. 'my-plugin/my-block/variation'),
		// or with a Core block without variation (e.g. 'core/social-link').
		return blockNameParts[ 0 ] + '/' + blockNameParts[ 1 ];
	} else if ( blockNameParts.length === 2 ) {
		// We're either dealing with a non-Core block (e.g. 'my-plugin/my-block')
		// or with a Core block with a variation (with an implied 'core/' namespace)
		// (e.g. 'social-link/wordpress').
		const potentialCoreBlockName = 'core/' + blockNameParts[ 0 ];
		const variations = getBlockVariations( potentialCoreBlockName );
		if (
			variations?.some(
				( variation ) => variation.name === blockNameParts[ 1 ]
			)
		) {
			return potentialCoreBlockName;
		}
		return blockNameParts[ 0 ] + '/' + blockNameParts[ 1 ];
	}

	// We're dealing with a Core block without a variation, and an implied 'core/' namespace.
	return blockNameParts[ 0 ];
}
