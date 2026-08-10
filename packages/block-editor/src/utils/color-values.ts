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
 * @param rawValue Raw style value stored in the style object.
 * @param type     Preset type, e.g. `'color'` or `'gradient'`.
 * @return The palette slug, or undefined.
 */
export function extractPresetSlug(
	rawValue: unknown,
	type: 'color' | 'gradient'
) {
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

/**
 * Encodes a color value for storage in the style object.
 *
 * When a `slug` is provided it is used directly (the slug-based selection
 * path). This is important because two palette entries can share the same
 * hex value (e.g. two custom colors both set to `#e10000`); relying on a
 * hex lookup alone would collapse them onto whichever entry appears first
 * in the palette and silently discard the user's actual choice. Only when
 * no slug is supplied does the function fall back to matching the hex value
 * against the palette; if a match is found the slug is encoded, otherwise
 * the raw value is stored as-is.
 *
 * Callers pass the flattened palette (`allColors`), typically computed once
 * per render from the per-origin `colors` array.
 *
 * @param allColors  Flat array of `{ color, slug }` objects.
 * @param colorValue Hex or CSS color string.
 * @param slug       Optional palette slug from slug-aware selection.
 * @return Encoded value suitable for the style object.
 */
export function encodeColorValueWithPalette(
	allColors: { color: string; slug: string }[],
	colorValue?: string,
	slug?: string
) {
	if ( slug ) {
		return 'var:preset|color|' + slug;
	}
	const colorObject = allColors.find( ( { color } ) => color === colorValue );
	return colorObject ? 'var:preset|color|' + colorObject.slug : colorValue;
}
