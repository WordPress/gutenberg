/**
 * Converts a string to kebab-case.
 * Matches WordPress kebabCase behavior.
 *
 * @param str The string to convert
 * @return The kebab-cased string
 */
export function kebabCase( str: string ): string {
	return str
		.replace( /([a-z])([A-Z])/g, '$1-$2' ) // camelCase to kebab-case
		.replace( /([0-9])([a-zA-Z])/g, '$1-$2' ) // number followed by letter
		.replace( /([a-zA-Z])([0-9])/g, '$1-$2' ) // letter followed by number
		.replace( /[\s_]+/g, '-' ) // spaces and underscores to hyphens
		.toLowerCase();
}
