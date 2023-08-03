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
 * getCoverIsDark is a method that specifyies if the cover background is dark or not and
 * applies the relevant attribute to help ensure that text is visible by default.
 * This needs to be recalculated in all of the following Cover block scenarios:
 * - When an overlay image is added, changed or removed
 * - When the featured image is selected as the overlay image, or removed from the overlay
 * - When the overlay color is changed
 * - When the overlay color is removed
 * - When the dimRatio is changed
 *
 * See the comments below for more details about which aspects take priority when
 * calculating the relative darkness of the Cover.
 *
 * @return {Function} Function to calculate isDark attribute.
 */
export default function useCoverIsDark() {
	const getCoverIsDark = useCallback(
		( url, dimRatio = 50, overlayColor ) => {
			// If the dimRatio is less than 50, the image will have the most impact on darkness.
			if ( url && dimRatio <= 50 ) {
				const imgCrossOrigin = applyFilters(
					'media.crossOrigin',
					undefined,
					url
				);
				return retrieveFastAverageColor()
					.getColorAsync( url, {
						// Previously the default color was white, but that changed
						// in v6.0.0 so it has to be manually set now.
						defaultColor: [ 255, 255, 255, 255 ],
						// Errors that come up don't reject the promise, so error
						// logging has to be silenced with this option.
						silent: process.env.NODE_ENV === 'production',
						crossOrigin: imgCrossOrigin,
					} )
					.then( ( color ) => {
						// __unstableMarkNextChangeAsNotPersistent();
						// setAttributes( { isDark: color.isDark } );
						return color.isDark;
					} );
			}

			// Once dimRatio is greater than 50, the overlay color will have most impact on darkness.
			if ( dimRatio > 50 ) {
				if ( ! overlayColor ) {
					// If no overlay color exists the overlay color is black so set to isDark.
					// __unstableMarkNextChangeAsNotPersistent();
					// setAttributes( { isDark: true } );
					return true;
				}
				// __unstableMarkNextChangeAsNotPersistent();
				// setAttributes( { isDark: colord( overlayColor ).isDark() } );
				return colord( overlayColor ).isDark();
			}

			// At this point there is no image and a dimRatio < 50 so even black can no be considered light.
			// __unstableMarkNextChangeAsNotPersistent();
			// setAttributes( { isDark: false } );
			return false;
		},
		[]
	);
	return getCoverIsDark;
}
