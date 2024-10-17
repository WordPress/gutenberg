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
	const canonicalBlockName = attributes.metadata?.alias;
	let blockName = name;
	const newAttributes = { ...attributes };
	if ( canonicalBlockName ) {
		blockName = canonicalBlockName;
		newAttributes.metadata.alias = name;
	}

	return [ blockName, newAttributes ];
}
