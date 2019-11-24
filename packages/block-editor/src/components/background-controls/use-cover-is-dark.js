/**
 * External dependencies
 */
import FastAverageColor from 'fast-average-color';
import tinycolor from 'tinycolor2';

/**
 * WordPress dependencies
 */
import {
	useEffect,
	useState,
} from '@wordpress/element';

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
 * @param {?string} url          Url of the media background.
 * @param {?number} dimRatio     Transparency of the overlay color. If an image and
 *                               color are set, dimRatio is used to decide what is used
 *                               for background darkness checking purposes.
 * @param {?string} overlayColor String containing the overlay color value if one exists.
 * @param {?Object} elementRef   If a media background is set, elementRef should contain a reference to a
 *                               dom element that renders that media.
 *
 * @return {boolean} True if the cover background is considered "dark" and false otherwise.
 */
export default function useCoverIsDark( url, dimRatio = 50, overlayColor, elementRef ) {
	const [ isDark, setIsDark ] = useState( false );
	useEffect( () => {
		// If opacity is lower than 50 the dominant color is the image or video color,
		// so use that color for the dark mode computation.
		if ( url && dimRatio <= 50 && elementRef.current ) {
			retrieveFastAverageColor().getColorAsync( elementRef.current, ( color ) => {
				setIsDark( color.isDark );
			} );
		}
	}, [ url, url && dimRatio <= 50 && elementRef.current, setIsDark ] );
	useEffect( () => {
		// If opacity is greater than 50 the dominant color is the overlay color,
		// so use that color for the dark mode computation.
		if ( dimRatio > 50 || ! url ) {
			if ( ! overlayColor ) {
				// If no overlay color exists the overlay color is black (isDark )
				setIsDark( true );
				return;
			}
			setIsDark( tinycolor( overlayColor ).isDark() );
		}
	}, [ overlayColor, dimRatio > 50 || ! url, setIsDark ] );
	useEffect( () => {
		if ( ! url && ! overlayColor ) {
			// Reset isDark
			setIsDark( false );
		}
	}, [ ! url && ! overlayColor, setIsDark ] );
	return isDark;
}
