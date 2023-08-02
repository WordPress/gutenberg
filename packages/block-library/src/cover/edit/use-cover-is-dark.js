/**
 * External dependencies
 */
import { FastAverageColor } from 'fast-average-color';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

function retrieveFastAverageColor() {
	if ( ! retrieveFastAverageColor.fastAverageColor ) {
		retrieveFastAverageColor.fastAverageColor = new FastAverageColor();
	}
	return retrieveFastAverageColor.fastAverageColor;
}

/**
 * useCoverIsDark is a hook that specifyies if the cover
 * background is dark or not.
 *
 * @return {Function} Function to calculate isDark attribute.
 */
export default function useCoverIsDark() {
	const setCoverIsDark = useCallback(
		async ( url, dimRatio = 50, overlayColor ) => {
			if ( url && dimRatio <= 50 ) {
				const imgCrossOrigin = applyFilters(
					'media.crossOrigin',
					undefined,
					url
				);
				const color = await retrieveFastAverageColor().getColorAsync(
					url,
					{
						// Previously the default color was white, but that changed
						// in v6.0.0 so it has to be manually set now.
						defaultColor: [ 255, 255, 255, 255 ],
						// Errors that come up don't reject the promise, so error
						// logging has to be silenced with this option.
						silent: process.env.NODE_ENV === 'production',
						crossOrigin: imgCrossOrigin,
					}
				);
				return color.isDark;
			}

			if ( dimRatio > 50 || ! url ) {
				if ( ! overlayColor ) {
					// If no overlay color exists the overlay color is black (isDark )
					return true;
				}

				return colord( overlayColor ).isDark();
			}

			if ( ! url && ! overlayColor ) {
				// Reset isDark.
				return false;
			}

			return false;
		},
		[]
	);
	return setCoverIsDark;
}
