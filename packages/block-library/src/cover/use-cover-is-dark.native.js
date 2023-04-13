/**
 * External dependencies
 */

import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * useCoverIsDark is a hook that returns a boolean variable specifying if the cover
 * background is dark or not.
 *
 * @param {?boolean} initialValue Initial value.
 * @param {?string}  url          Url of the media background.
 * @param {?number}  dimRatio     Transparency of the overlay color. If an image and
 *                                color are set, dimRatio is used to decide what is used
 *                                for background darkness checking purposes.
 * @param {?string}  overlayColor String containing the overlay color value if one exists.
 *
 * @return {boolean} True if the cover background is considered "dark" and false otherwise.
 */
export default function useCoverIsDark(
	initialValue = false,
	url,
	dimRatio = 50,
	overlayColor
) {
	const [ isDark, setIsDark ] = useState( initialValue );
	useEffect( () => {
		// If opacity is greater than 50 the dominant color is the overlay color,
		// so use that color for the dark mode computation.
		if ( dimRatio > 50 || ! url ) {
			if ( ! overlayColor ) {
				// If no overlay color exists the overlay color is black (isDark )
				setIsDark( true );
				return;
			}
			setIsDark( colord( overlayColor ).isDark() );
		}
	}, [ overlayColor, dimRatio > 50 || ! url, setIsDark ] );
	useEffect( () => {
		if ( ! url && ! overlayColor ) {
			// Reset isDark.
			setIsDark( false );
		}
	}, [ ! url && ! overlayColor, setIsDark ] );
	return isDark;
}
