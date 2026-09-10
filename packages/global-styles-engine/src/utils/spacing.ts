/**
 * Internal dependencies
 */
import type {
	SpacingSizePreset,
	GlobalStylesSettings,
	FluidSpacingSettings,
	SpacingSettings,
} from '../types';
import { getComputedFluidTypographyValue } from './fluid';

export function getSpacingPresetCssVar( value?: string ) {
	if ( ! value ) {
		return;
	}

	const slug = value.match( /var:preset\|spacing\|(.+)/ );

	if ( ! slug ) {
		return value;
	}

	return `var(--wp--preset--spacing--${ slug[ 1 ] })`;
}

/**
 * Checks if fluid spacing is enabled in the given spacing settings.
 *
 * Fluid spacing is considered enabled if the fluid setting is explicitly set to true,
 * or if it's an object with properties (which would contain fluid spacing configuration
 * like minViewportWidth, maxViewportWidth).
 *
 * @param spacingSettings       Spacing settings object that may contain fluid spacing configuration.
 * @param spacingSettings.fluid Fluid spacing configuration. Can be:
 *                              - `true` to enable with default settings
 *                              - An object with fluid settings (minViewportWidth, maxViewportWidth)
 *                              - `false` or `undefined` to disable
 *
 * @return True if fluid spacing is enabled, false otherwise.
 */
function isFluidSpacingEnabled(
	spacingSettings?: SpacingSettings | SpacingSizePreset
) {
	const fluidSettings = spacingSettings?.fluid;
	return (
		true === fluidSettings ||
		( fluidSettings &&
			typeof fluidSettings === 'object' &&
			Object.keys( fluidSettings ).length > 0 )
	);
}

/**
 * Returns a spacing value based on a given spacing-size preset.
 * Takes into account fluid spacing parameters and attempts to return a css formula depending on available, valid values.
 *
 * The Core PHP equivalent is gutenberg_get_spacing_size_value().
 *
 * Unlike fluid typography, fluid spacing has no formula to derive a minimum
 * value from a single size, so a preset only becomes fluid when it explicitly
 * declares both a `min` and a `max` value. A preset with `fluid: false`, or
 * fluid enabled without explicit bounds, falls back to its static `size`.
 *
 * @param preset   A spacing-size preset object containing size and fluid properties.
 * @param settings Global styles settings object containing spacing settings.
 *
 * @return A spacing value or the value of preset.size.
 */
export function getSpacingSizeValue(
	preset: SpacingSizePreset,
	settings: GlobalStylesSettings
) {
	const { size: defaultSize } = preset;

	/*
	 * Catch falsy values and 0/'0'. Fluid calculations cannot be performed on `0`.
	 * Also return early when a preset spacing size explicitly disables fluid spacing with `false`.
	 */
	if ( ! defaultSize || '0' === defaultSize || false === preset?.fluid ) {
		return defaultSize;
	}

	/*
	 * Return early when fluid spacing is disabled in the settings, and there
	 * are no local settings to enable it for the individual preset.
	 */
	if (
		! isFluidSpacingEnabled( settings?.spacing ) &&
		! isFluidSpacingEnabled( preset )
	) {
		return defaultSize;
	}

	// A preset only goes fluid when it explicitly declares both a min and a max.
	if ( typeof preset?.fluid !== 'object' ) {
		return defaultSize;
	}

	const { min: minimumSpacingSize, max: maximumSpacingSize } = preset.fluid;
	if ( ! minimumSpacingSize || ! maximumSpacingSize ) {
		return defaultSize;
	}

	const fluidSpacingSettings: FluidSpacingSettings =
		typeof settings?.spacing?.fluid === 'object'
			? settings.spacing.fluid
			: {};

	const fluidSpacingSizeValue = getComputedFluidTypographyValue( {
		minimumFontSize: minimumSpacingSize,
		maximumFontSize: maximumSpacingSize,
		maximumViewportWidth: fluidSpacingSettings?.maxViewportWidth,
		minimumViewportWidth: fluidSpacingSettings?.minViewportWidth,
	} );

	if ( !! fluidSpacingSizeValue ) {
		return fluidSpacingSizeValue;
	}

	return defaultSize;
}
