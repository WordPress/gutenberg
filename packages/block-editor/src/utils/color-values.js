/**
 * Extracts the palette slug from a style value, supporting both the user
 * preset format and the theme CSS-variable format:
 *
 * - User format:  `var:preset|color|slug`
 * - Theme format: `var(--wp--preset--color--slug)`
 *
 * Returns `undefined` for plain hex values, non-strings, or any other
 * unrecognised format.
 *
 * @param {*} rawValue Raw style value stored in the style object.
 * @return {string|undefined} The palette slug, or undefined.
 */
export function extractColorSlug( rawValue ) {
	if ( typeof rawValue !== 'string' ) {
		return undefined;
	}
	if ( rawValue.startsWith( 'var:preset|color|' ) ) {
		return rawValue.slice( 'var:preset|color|'.length );
	}
	const themeFormatMatch = rawValue.match(
		/^var\(--wp--preset--color--([^)]+)\)$/
	);
	return themeFormatMatch?.[ 1 ];
}
