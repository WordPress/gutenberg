/**
 * Internal dependencies
 */
import type {
	TypographyPreset,
	GlobalStylesSettings,
	FluidTypographySettings,
	TypographySettings,
} from '../types';
import {
	getTypographyValueAndUnit,
	getComputedFluidTypographyValue,
} from './fluid';

/**
 * Checks if fluid typography is enabled in the given typography settings.
 *
 * Fluid typography is considered enabled if the fluid setting is explicitly set to true,
 * or if it's an object with properties (which would contain fluid typography configuration
 * like minViewportWidth, maxViewportWidth, etc.).
 *
 * @param typographySettings       Typography settings object that may contain fluid typography configuration.
 * @param typographySettings.fluid Fluid typography configuration. Can be:
 *                                 - `true` to enable with default settings
 *                                 - An object with fluid settings (minViewportWidth, maxViewportWidth, etc.)
 *                                 - `false` or `undefined` to disable
 *
 * @return True if fluid typography is enabled, false otherwise.
 */
function isFluidTypographyEnabled(
	typographySettings?: TypographySettings | TypographyPreset
) {
	const fluidSettings = typographySettings?.fluid;
	return (
		true === fluidSettings ||
		( fluidSettings &&
			typeof fluidSettings === 'object' &&
			Object.keys( fluidSettings ).length > 0 )
	);
}

/**
 * Returns fluid typography settings from theme.json setting object.
 *
 * @param settings            Theme.json settings
 * @param settings.typography Theme.json typography settings
 * @param settings.layout     Theme.json layout settings
 * @return Fluid typography settings
 */
export function getFluidTypographyOptionsFromSettings(
	settings: GlobalStylesSettings
): { fluid?: FluidTypographySettings | boolean | undefined } {
	const typographySettings = settings?.typography ?? {};
	const layoutSettings = settings?.layout;
	const defaultMaxViewportWidth = getTypographyValueAndUnit(
		layoutSettings?.wideSize
	)
		? layoutSettings?.wideSize
		: null;
	return isFluidTypographyEnabled( typographySettings ) &&
		defaultMaxViewportWidth
		? {
				fluid: {
					maxViewportWidth: defaultMaxViewportWidth,
					...( typeof typographySettings.fluid === 'object'
						? typographySettings.fluid
						: {} ),
				},
		  }
		: {
				fluid: typographySettings?.fluid,
		  };
}

/**
 * Returns a font-size value based on a given font-size preset.
 * Takes into account fluid typography parameters and attempts to return a css formula depending on available, valid values.
 *
 * The Core PHP equivalent is wp_get_typography_font_size_value().
 *
 * @param preset   A typography preset object containing size and fluid properties.
 * @param settings Global styles settings object containing typography and layout settings.
 *
 * @return A font-size value or the value of preset.size.
 */
export function getTypographyFontSizeValue(
	preset: TypographyPreset,
	settings: GlobalStylesSettings
) {
	const { size: defaultSize } = preset;

	/*
	 * Catch falsy values and 0/'0'. Fluid calculations cannot be performed on `0`.
	 * Also return early when a preset font size explicitly disables fluid typography with `false`.
	 */
	if ( ! defaultSize || '0' === defaultSize || false === preset?.fluid ) {
		return defaultSize;
	}

	/*
	 * Return early when fluid typography is disabled in the settings, and there
	 * are no local settings to enable it for the individual preset.
	 *
	 * If this condition isn't met, either the settings or individual preset settings
	 * have enabled fluid typography.
	 */
	if (
		! isFluidTypographyEnabled( settings?.typography ) &&
		! isFluidTypographyEnabled( preset )
	) {
		return defaultSize;
	}

	const fluidTypographySettings =
		getFluidTypographyOptionsFromSettings( settings )?.fluid ?? {};

	const fluidFontSizeValue = getComputedFluidTypographyValue( {
		minimumFontSize:
			typeof preset?.fluid === 'boolean' ? undefined : preset?.fluid?.min,
		maximumFontSize:
			typeof preset?.fluid === 'boolean' ? undefined : preset?.fluid?.max,
		fontSize: defaultSize,
		minimumFontSizeLimit:
			typeof fluidTypographySettings === 'object'
				? fluidTypographySettings?.minFontSize
				: undefined,
		maximumViewportWidth:
			typeof fluidTypographySettings === 'object'
				? fluidTypographySettings?.maxViewportWidth
				: undefined,
		minimumViewportWidth:
			typeof fluidTypographySettings === 'object'
				? fluidTypographySettings?.minViewportWidth
				: undefined,
	} );

	if ( !! fluidFontSizeValue ) {
		return fluidFontSizeValue;
	}

	return defaultSize;
}
