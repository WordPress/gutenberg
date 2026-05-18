/**
 * Extracts the palette slug from a style value for any preset type, supporting
 * both the user preset format and the theme CSS-variable format:
 *
 * - User format:  `var:preset|<type>|slug`
 * - Theme format: `var(--wp--preset--<type>--slug)`
 *
 * Returns `undefined` for plain values, non-strings, or any other
 * unrecognised format.
 *
 * @param {*}                  rawValue Raw style value stored in the style object.
 * @param {'color'|'gradient'} type     Preset type, e.g. `'color'` or `'gradient'`.
 * @return {string|undefined} The palette slug, or undefined.
 */
export function extractPresetSlug( rawValue, type ) {
	if ( typeof rawValue !== 'string' ) {
		return undefined;
	}
	const userPrefix = `var:preset|${ type }|`;
	if ( rawValue.startsWith( userPrefix ) ) {
		return rawValue.slice( userPrefix.length );
	}
	const cssVarPrefix = `--wp--preset--${ type }--`;
	const themeFormatMatch = rawValue.match(
		new RegExp( `^var\\(${ cssVarPrefix }([^)]+)\\)$` )
	);
	return themeFormatMatch?.[ 1 ];
}
