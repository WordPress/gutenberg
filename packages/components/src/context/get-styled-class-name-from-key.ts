import memoize from 'memize';

/**
 * Generates the connected component CSS className based on the namespace.
 *
 * @param namespace The name of the connected component.
 * @return The generated CSS className.
 */
function getStyledClassName( namespace: string ): string {
	const kebab = namespace
		.replace( /([a-z0-9])([A-Z])/g, '$1-$2' )
		.replace( /([A-Z])([A-Z][a-z])/g, '$1-$2' )
		.replace( /[^A-Z0-9]+/gi, '-' )
		.replace( /^-|-$/g, '' )
		.toLowerCase();
	return `components-${ kebab }`;
}

export const getStyledClassNameFromKey = memoize( getStyledClassName );
