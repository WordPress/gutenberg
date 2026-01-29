const UNITED_VALUE_REGEX =
	/^([\d.\-+]*)\s*(fr|cm|mm|Q|in|pc|pt|px|em|ex|ch|rem|lh|vw|vh|vmin|vmax|%|cap|ic|rlh|vi|vb|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|svw|lvw|dvw|svh|lvh|dvh|svi|lvi|dvi|svb|lvb|dvb|svmin|lvmin|dvmin|svmax|lvmax|dvmax)?$/;

/**
 * Parses a number and unit from a value.
 *
 * @param toParse Value to parse
 *
 * @return  The extracted number and unit.
 */
export function parseCSSUnitValue(
	toParse: string
): [ number | undefined, string | undefined ] {
	const value = toParse.trim();

	const matched = value.match( UNITED_VALUE_REGEX );
	if ( ! matched ) {
		return [ undefined, undefined ];
	}
	const [ , num, unit ] = matched;
	let numParsed: number | undefined = parseFloat( num );
	numParsed = Number.isNaN( numParsed ) ? undefined : numParsed;

	return [ numParsed, unit ];
}

/**
 * Combines a value and a unit into a unit value.
 *
 * @param value
 * @param unit
 *
 * @return The unit value.
 */
export function createCSSUnitValue(
	value: string | number,
	unit: string
): string {
	return `${ value }${ unit }`;
}
