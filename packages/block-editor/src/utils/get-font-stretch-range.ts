import { parseFontStretchValue } from './parse-font-stretch';
import type { FontFamilyFace } from './types';

/**
 * The widths a variable font can draw, as percentages.
 */
export interface FontStretchRange {
	min: number;
	max: number;
}

/**
 * Returns the width range that a font family's variable faces declare.
 *
 * A face declares a variable `wdth` axis with a range in `fontStretch`, such as
 * `"25% 151%"`. Either end may be named rather than written as a percentage,
 * since the descriptor takes the same keywords the property does. When several
 * faces declare ranges, the result spans all of them. Faces with a single width
 * are static and do not count.
 *
 * @param fontFamilyFaces Font family faces from theme.json.
 * @return The range, or `undefined` when no face declares one.
 */
export function getFontStretchRange(
	fontFamilyFaces: FontFamilyFace[] | undefined
): FontStretchRange | undefined {
	let range: FontStretchRange | undefined;

	fontFamilyFaces?.forEach( ( { fontStretch } ) => {
		if ( 'string' !== typeof fontStretch ) {
			return;
		}
		const parts = fontStretch.trim().split( /\s+/ );
		if ( parts.length < 2 ) {
			return;
		}
		const start = parseFontStretchValue( parts[ 0 ] );
		const end = parseFontStretchValue( parts[ 1 ] );
		if ( start === undefined || end === undefined ) {
			return;
		}
		const min = Math.min( start, end );
		const max = Math.max( start, end );
		range = range
			? {
					min: Math.min( range.min, min ),
					max: Math.max( range.max, max ),
				}
			: { min, max };
	} );

	return range;
}
