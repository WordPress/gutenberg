/**
 * External dependencies
 */
import { FastAverageColor } from 'fast-average-color';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

function retrieveFastAverageColor() {
	if ( ! retrieveFastAverageColor.fastAverageColor ) {
		retrieveFastAverageColor.fastAverageColor = new FastAverageColor();
	}
	return retrieveFastAverageColor.fastAverageColor;
}

/**
 * useCoverIsDark is a hook that returns a boolean variable specifying if the cover
 * background is dark or not.
 *
 * If opacity is lower than 50, the dominant color is the media color, so the
 * average media color is used for the dark mode calculation.
 *
 * If opacity is greater than 50 the dominant color is the overlay color, so the
 * overlay color is used for the dark mode calculation.
 *
 * Additionally, if background media isn't present, the overlay color is used
 * for the dark mode calculation since the parent/body background color would
 * show through and we don't have access to the parent/body background color for
 * the calculation.
 *
 * @param {?string} url          Url of the media background.
 * @param {?number} dimRatio     Transparency of the overlay color. If an image and
 *                               color are set, dimRatio is used to decide what is used
 *                               for background darkness checking purposes.
 * @param {?string} overlayColor String containing the overlay color value if one exists.
 *
 * @return {boolean} True if the cover background is considered "dark" and false otherwise.
 */
export default function useCoverIsDark( url, dimRatio = 50, overlayColor ) {
	const [ isDark, setIsDark ] = useState( false );
	const isMediaCalculation = dimRatio <= 50 && url;
	useEffect( () => {
		if ( isMediaCalculation && elementRef.current ) {
			retrieveFastAverageColor().getColorAsync(
				elementRef.current,
				( color ) => {
					setIsDark( color.isDark );
				}
			);
		} else {
			// If no overlay color exists the overlay color is black (isDark).
			setIsDark( ! overlayColor || colord( overlayColor ).isDark() );
		}
	}, [ isMediaCalculation, overlayColor, elementRef.current, setIsDark ] );
	return isDark;
}
