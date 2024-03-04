/**
 * Transforms a kebab-case string to camelCase.
 *
 * @param {string} str The kebab-case string to transform to camelCase.
 * @return {string} The transformed camelCase string.
 */
export function kebabToCamelCase( str ) {
	return str
		.replace( /^-+|-+$/g, '' )
		.toLowerCase()
		.replace( /-([a-z])/g, function ( match, group1 ) {
			return group1.toUpperCase();
		} );
}
