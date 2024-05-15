/**
 * Internal dependencies
 */
import { getBlockVariations, getBlockType } from '../registration';

/**
 * Convert alias blocks to their canonical form. This function is used
 * both in the parser level for previous content and to convert such blocks
 * used in Custom Post Types templates.
 *
 * @param {string} name       The block's name
 * @param {Object} attributes The block's attributes
 *
 * @return {[string, Object]} The block's name and attributes, changed accordingly if a match was found
 */
export function convertAliasBlockNameAndAttributes( name, attributes ) {
	let canonicalBlockName = name;

	const blockVariation = name.split( '/' )?.[ 2 ];
	if ( blockVariation ) {
		// FIXME: Stabler way of extracting canonical block name.
		canonicalBlockName = name.replace( `/${ blockVariation }`, '' );
		// const variations = getBlockVariations( canonicalBlockName );
		// TODO: Validate. (Check if variation exists in variations array.)
	}

	const { metadata = {}, ...otherAttributes } = attributes;

	let newAttributes = { ...otherAttributes };

	// TODO: Tidy up a bit more. Replace with attribute inference (in serializer)?
	if ( canonicalBlockName ) {
		newAttributes = {
			...otherAttributes,
			metadata: { ...metadata, canonical: canonicalBlockName },
		};
	}

	return [ canonicalBlockName, newAttributes ];
}
