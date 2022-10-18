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
 * @typedef {Object} FluidPreset
 * @property {string|undefined}  max A maximum font size value.
 * @property {?string|undefined} min A minimum font size value.
 */

/**
 * @typedef {Object} Preset
 * @property {?string|?number}               size  A default font size.
 * @property {string}                        name  A font size name, displayed in the UI.
 * @property {string}                        slug  A font size slug
 * @property {boolean|FluidPreset|undefined} fluid A font size slug
 */

/**
 * Returns a font-size value based on a given font-size preset.
 * Takes into account fluid typography parameters and attempts to return a css formula depending on available, valid values.
 *
 * @param {Preset}  preset
 * @param {Object}  typographySettings
 * @param {boolean} typographySettings.fluid Whether fluid typography is enabled.
 *
 * @return {string|*} A font-size value or the value of preset.size.
 */
export function getTypographyFontSizeValue( preset, typographySettings ) {
	const { size: defaultSize } = preset;

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
	if ( false === preset?.fluid ) {
		return defaultSize;
	}

	const fluidFontSizeValue = getComputedFluidTypographyValue( {
		minimumFontSize: preset?.fluid?.min,
		maximumFontSize: preset?.fluid?.max,
		fontSize: defaultSize,
	} );

	if ( !! fluidFontSizeValue ) {
		return fluidFontSizeValue;
	}

	return defaultSize;
}
