/**
 * External dependencies
 */
import { PixelRatio } from 'react-native';

const clamp = ( value, min, max ) => {
	return Math.min( Math.max( value, min ), max );
};

/**
 * Function to adjust font size for screen display based on user's device settings.
 *
 * This function calculates an adjusted font size by scaling the provided `currentFontSize`
 * according to the user's device font scale settings. This is particularly useful for
 * respecting accessibility preferences such as larger text sizes set by the user.
 *
 * The calculated font size is then clamped within the specified range defined by
 * `minFontSize` and `maxFontSize` to ensure it remains within a reasonable and
 * manageable range for the app's UI.
 *
 * @param {number} currentFontSize - The base font size to be adjusted.
 * @param {number} minFontSize     - The minimum font size limit for the adjustment.
 * @param {number} maxFontSize     - The maximum font size limit for the adjustment.
 * @return {number}                - The adjusted font size.
 */
export function getScreenAdjustedFontSize(
	currentFontSize,
	minFontSize = 12,
	maxFontSize = 100
) {
	if ( typeof currentFontSize !== 'number' || isNaN( currentFontSize ) ) {
		return undefined;
	}

	const fontScale = PixelRatio.getFontScale() ?? 1;
	const scaledFontSize = currentFontSize * fontScale;
	const fontSize = clamp( scaledFontSize, minFontSize, maxFontSize );
	return fontSize;
}
