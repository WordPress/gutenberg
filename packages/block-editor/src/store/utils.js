/**
 * Helper function that maps attribute definition properties to the
 * ones used by RichText utils like `create, toHTMLString, etc..`.
 *
 * @param {Object} attributeDefinition A block's attribute definition object.
 * @return {Object} The mapped object.
 */
export function mapRichTextSettings( attributeDefinition ) {
	const { __unstablePreserveWhiteSpace: preserveWhiteSpace } =
		attributeDefinition;
	return { preserveWhiteSpace };
}

export function findRichTextAttributeKey( blockType ) {
	for ( const [ key, value ] of Object.entries( blockType.attributes ) ) {
		if ( value.type === 'string' && value.source === 'html' ) {
			return key;
		}
	}
}
