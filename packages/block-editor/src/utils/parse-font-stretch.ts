/*
 * The widths `font-stretch` names, as the percentage each one stands for. A
 * static family picks the face nearest the percentage; a variable one moves
 * its `wdth` axis to that coordinate, so the same keyword means the same width
 * either way.
 */
export const FONT_STRETCH_KEYWORDS: Record< string, number > = {
	'ultra-condensed': 50,
	'extra-condensed': 62.5,
	condensed: 75,
	'semi-condensed': 87.5,
	normal: 100,
	'semi-expanded': 112.5,
	expanded: 125,
	'extra-expanded': 150,
	'ultra-expanded': 200,
};

/**
 * Reads a `font-stretch` value as a percentage, whether it is written as one
 * or named with one of the keywords the property accepts.
 *
 * @param value A width, such as `condensed` or `75%`.
 * @return The percentage, or undefined when the value is not a width.
 */
export function parseFontStretchValue( value: string ): number | undefined {
	const token = value.trim().toLowerCase();
	if ( token in FONT_STRETCH_KEYWORDS ) {
		return FONT_STRETCH_KEYWORDS[ token ];
	}
	const percentage = token.match( /^(\d*\.?\d+)%$/ );
	if ( ! percentage ) {
		return undefined;
	}
	const width = Number( percentage[ 1 ] );
	// A width is a non-negative percentage; there is no upper bound.
	return Number.isFinite( width ) && width >= 0 ? width : undefined;
}
