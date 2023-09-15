/**
 * External dependencies
 */
import { FastAverageColor } from 'fast-average-color';

/**
 * Performs a Porter Duff composite source over operation on two rgba colors.
 *
 * @see https://www.w3.org/TR/compositing-1/#porterduffcompositingoperators_srcover
 *
 * @param {import('colord').RgbaColor} source Source color.
 * @param {import('colord').RgbaColor} dest   Destination color.
 * @return {import('colord').RgbaColor} Composite color.
 */
export function compositeSourceOver( source, dest ) {
	return {
		r: source.r * source.a + dest.r * dest.a * ( 1 - source.a ),
		g: source.g * source.a + dest.g * dest.a * ( 1 - source.a ),
		b: source.b * source.a + dest.b * dest.a * ( 1 - source.a ),
		a: source.a + dest.a * ( 1 - source.a ),
	};
}

export function retrieveFastAverageColor() {
	if ( ! retrieveFastAverageColor.fastAverageColor ) {
		retrieveFastAverageColor.fastAverageColor = new FastAverageColor();
	}
	return retrieveFastAverageColor.fastAverageColor;
}
