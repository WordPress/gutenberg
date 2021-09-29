/**
 * Internal dependencies
 */
import { SETTINGS_DEFAULTS } from '../store/defaults';

/**
 * Given an array of theme colors checks colors for validity
 *
 * @param {Array} colors The array of theme colors
 *
 * @return {Array} The array of valid theme colors or the default colors
 */
export function validateThemeColors( colors ) {
	if ( colors === undefined ) {
		colors = SETTINGS_DEFAULTS.colors;
	} else {
		const validColors = colors.filter( ( c ) => c.color );
		if ( validColors.length === 0 ) {
			colors = SETTINGS_DEFAULTS.colors;
		} else if ( validColors.length < colors.length ) {
			// Filter out invalid colors
			colors = validColors;
		}
	}
	return colors;
}

/**
 * Given an array of theme gradients checks gradients for validity
 *
 * @param {Array} gradients The array of theme gradients
 *
 * @return {Array} The array of valid theme gradients or the default gradients
 */
export function validateThemeGradients( gradients ) {
	if ( gradients === undefined ) {
		gradients = SETTINGS_DEFAULTS.gradients;
	} else {
		const validGradients = gradients.filter( ( c ) => c.gradient );
		if ( validGradients.length === 0 ) {
			gradients = SETTINGS_DEFAULTS.gradients;
		} else if ( validGradients.length < gradients.length ) {
			// Filter out invalid gradients
			gradients = validGradients;
		}
	}
	return gradients;
}
