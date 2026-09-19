import type { FontFamilyFace } from './types';

/**
 * The weights a variable font can draw.
 */
export interface FontWeightRange {
	min: number;
	max: number;
}

/**
 * Returns the weight range that a font family's variable faces declare.
 *
 * A face declares a variable `wght` axis with a range in `fontWeight`, such as
 * `"100 900"`. When several faces declare ranges, the result spans all of them.
 * Faces with a single weight are static and do not count.
 *
 * @param fontFamilyFaces Font family faces from theme.json.
 * @return The range, or `undefined` when no face declares one.
 */
export function getFontWeightRange(
	fontFamilyFaces: FontFamilyFace[] | undefined
): FontWeightRange | undefined {
	let range: FontWeightRange | undefined;

	fontFamilyFaces?.forEach( ( { fontWeight } ) => {
		if ( 'string' !== typeof fontWeight ) {
			return;
		}
		const parts = fontWeight.trim().split( /\s+/ );
		if ( parts.length < 2 ) {
			return;
		}
		const start = parseInt( parts[ 0 ], 10 );
		const end = parseInt( parts[ 1 ], 10 );
		if ( Number.isNaN( start ) || Number.isNaN( end ) ) {
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
