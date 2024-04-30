/**
 * Transforms a kebab-case string to camelCase.
 *
 * @param str The kebab-case string to transform to camelCase.
 * @return The transformed camelCase string.
 */
export function kebabToCamelCase( str: string ): string {
	return str
		.replace( /^-+|-+$/g, '' )
		.toLowerCase()
		.replace( /-([a-z])/g, function ( _match, group1: string ) {
			return group1.toUpperCase();
		} );
}
