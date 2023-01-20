/**
 * The fluid utilities must match the backend equivalent.
 * See: gutenberg_get_typography_font_size_value() in lib/block-supports/typography.php
 * ---------------------------------------------------------------
 */

/**
 * Internal dependencies
 */
import { getComputedFluidTypographyValue } from '../font-sizes/fluid-utils';

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
 * @typedef {Object} TypographySettings
 * @property {?string|?number} size              A default font size.
 * @property {?string}         minViewPortWidth  Minimum viewport size from which type will have fluidity. Optional if size is specified.
 * @property {?string}         maxViewPortWidth  Maximum size up to which type will have fluidity. Optional if size is specified.
 * @property {?number}         scaleFactor       A scale factor to determine how fast a font scales within boundaries. Optional.
 * @property {?number}         minFontSizeFactor How much to scale defaultFontSize by to derive minimumFontSize. Optional.
 * @property {?string}         minFontSize       The smallest a calculated font size may be. Optional.
 */

/**
 * Returns a font-size value based on a given font-size preset.
 * Takes into account fluid typography parameters and attempts to return a css formula depending on available, valid values.
 *
 * @param {Preset}                     preset
 * @param {Object}                     typographySettings
 * @param {boolean|TypographySettings} typographySettings.fluid Whether fluid typography is enabled, and, optionally, fluid font size options.
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

	if (
		! typographySettings?.fluid ||
		( typeof typographySettings?.fluid === 'object' &&
			Object.keys( typographySettings.fluid ).length === 0 )
	) {
		return defaultSize;
	}

	// A font size has explicitly bypassed fluid calculations.
	if ( false === preset?.fluid ) {
		return defaultSize;
	}

	const fluidTypographySettings =
		typeof typographySettings?.fluid === 'object'
			? typographySettings?.fluid
			: {};

	const fluidFontSizeValue = getComputedFluidTypographyValue( {
		minimumFontSize: preset?.fluid?.min,
		maximumFontSize: preset?.fluid?.max,
		fontSize: defaultSize,
		minimumFontSizeLimit: fluidTypographySettings?.minFontSize,
	} );

	if ( !! fluidFontSizeValue ) {
		return fluidFontSizeValue;
	}

	return defaultSize;
}
