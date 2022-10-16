/**
 * The fluid utilities must match the backend equivalent.
 * See: gutenberg_get_typography_font_size_value() in lib/block-supports/typography.php
 * ---------------------------------------------------------------
 */

/**
 * WordPress dependencies
 */
import { getComputedFluidTypographyValue } from '@wordpress/block-editor';

/**
 * @typedef {Object} FluidValues
 * @property {string|undefined} max A maximum font size value.
 * @property {?string|undefined} min A minimum font size value.
 */

/**
 * @typedef {Object} FontSize
 * @property {?string|?number}               size  A default font size.
 * @property {string}                        name  A font size name, displayed in the UI.
 * @property {string}                        slug  A font size slug
 * @property {boolean|FluidValues|undefined} fluid A font size slug
 */

/**
 * Returns a font-size value based on a given fontSize.
 * The fontSize is represented in the preset format as seen in theme.json.
 * Takes into account fluid typography parameters and attempts to return a css formula depending on available, valid values.
 *
 * @param {FontSize} fontSize
 * @param {Object}   typographySettings
 * @param {boolean}  typographySettings.fluid Whether fluid typography is enabled.
 *
 * @return {string|*} A font-size value or the value of fontSize.size.
 */
export function getTypographyFontSizeValue( fontSize, typographySettings ) {
	const { size: defaultSize } = fontSize;

	/*
	 * Catches falsy values and 0/'0'.
	 * Fluid calculations cannot be performed on 0.
	 */
	if ( ! defaultSize || '0' === defaultSize ) {
		return defaultSize;
	}

	if ( true !== typographySettings?.fluid ) {
		return defaultSize;
	}

	// A font size has explicitly bypassed fluid calculations.
	if ( false === fontSize?.fluid ) {
		return defaultSize;
	}

	const fluidFontSizeValue = getComputedFluidTypographyValue( {
		minimumFontSize: fontSize?.fluid?.min,
		maximumFontSize: fontSize?.fluid?.max,
		fontSize: defaultSize,
	} );

	if ( !! fluidFontSizeValue ) {
		return fluidFontSizeValue;
	}

	return defaultSize;
}
