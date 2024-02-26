/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import { FastAverageColor } from 'fast-average-color';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * @typedef {import('colord').RgbaColor} RgbaColor
 */

extend( [ namesPlugin ] );

/**
 * Fallback color when the average color can't be computed. The image may be
 * rendering as transparent, and most sites have a light color background.
 */
export const DEFAULT_BACKGROUND_COLOR = '#FFF';

/**
 * Default dim color specified in style.css.
 */
export const DEFAULT_OVERLAY_COLOR = '#000';

/**
 * Performs a Porter Duff composite source over operation on two rgba colors.
 *
 * @see {@link https://www.w3.org/TR/compositing-1/#porterduffcompositingoperators_srcover}
 *
 * @param {RgbaColor} source Source color.
 * @param {RgbaColor} dest   Destination color.
 *
 * @return {RgbaColor} Composite color.
 */
export function compositeSourceOver( source, dest ) {
	return {
		r: source.r * source.a + dest.r * dest.a * ( 1 - source.a ),
		g: source.g * source.a + dest.g * dest.a * ( 1 - source.a ),
		b: source.b * source.a + dest.b * dest.a * ( 1 - source.a ),
		a: source.a + dest.a * ( 1 - source.a ),
	};
}

/**
 * Retrieves the FastAverageColor singleton.
 *
 * @return {FastAverageColor} The FastAverageColor singleton.
 */
export function retrieveFastAverageColor() {
	if ( ! retrieveFastAverageColor.fastAverageColor ) {
		retrieveFastAverageColor.fastAverageColor = new FastAverageColor();
	}
	return retrieveFastAverageColor.fastAverageColor;
}

/**
 * Computes the average color of an image.
 *
 * @param {string} url The url of the image.
 *
 * @return {Promise<string>} Promise of an average color as a hex string.
 */
export const getMediaColor = memoize( async ( url ) => {
	if ( ! url ) {
		return DEFAULT_BACKGROUND_COLOR;
	}

	// making the default color rgb for compat with FAC
	const { r, g, b, a } = colord( DEFAULT_BACKGROUND_COLOR ).toRgb();

	try {
		const imgCrossOrigin = applyFilters(
			'media.crossOrigin',
			undefined,
			url
		);
		const color = await retrieveFastAverageColor().getColorAsync( url, {
			// The default color is white, which is the color
			// that is returned if there's an error.
			// colord returns alpga 0-1, FAC needs 0-255
			defaultColor: [ r, g, b, a * 255 ],
			// Errors that come up don't reject the promise,
			// so error logging has to be silenced
			// with this option.
			silent: process.env.NODE_ENV === 'production',
			crossOrigin: imgCrossOrigin,
		} );
		return color.hex;
	} catch ( error ) {
		// If there's an error return the fallback color.
		return DEFAULT_BACKGROUND_COLOR;
	}
} );

/**
 * Computes if the color combination of the overlay and background color is dark.
 *
 * @param {number} dimRatio        Opacity of the overlay between 0 and 100.
 * @param {string} overlayColor    CSS color string for the overlay.
 * @param {string} backgroundColor CSS color string for the background.
 *
 * @return {boolean} true if the color combination composite result is dark.
 */
export function compositeIsDark( dimRatio, overlayColor, backgroundColor ) {
	// Opacity doesn't matter if you're overlaying the same color on top of itself.
	// And background doesn't matter when overlay is fully opaque.
	if ( overlayColor === backgroundColor || dimRatio === 100 ) {
		return colord( overlayColor ).isDark();
	}
	const overlay = colord( overlayColor )
		.alpha( dimRatio / 100 )
		.toRgb();
	const background = colord( backgroundColor ).toRgb();
	const composite = compositeSourceOver( overlay, background );
	return colord( composite ).isDark();
}
