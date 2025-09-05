/**
 * The fluid utilities must match the backend equivalent.
 * See: gutenberg_get_typography_font_size_value() in lib/block-supports/typography.php
 * ---------------------------------------------------------------
 */

/**
 * Internal dependencies
 */
import {
	getComputedFluidTypographyValue,
	getTypographyValueAndUnit,
} from '../font-sizes/fluid-utils';
import { getFontStylesAndWeights } from '../../utils/get-font-styles-and-weights';

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
 * @property {boolean|FluidPreset|undefined} fluid Specifies the minimum and maximum font size value of a fluid font size.
 */

/**
 * @typedef {Object} TypographySettings
 * @property {?string} minViewportWidth  Minimum viewport size from which type will have fluidity. Optional if size is specified.
 * @property {?string} maxViewportWidth  Maximum size up to which type will have fluidity. Optional if size is specified.
 * @property {?number} scaleFactor       A scale factor to determine how fast a font scales within boundaries. Optional.
 * @property {?number} minFontSizeFactor How much to scale defaultFontSize by to derive minimumFontSize. Optional.
 * @property {?string} minFontSize       The smallest a calculated font size may be. Optional.
 */

/**
 * Returns a font-size value based on a given font-size preset.
 * Takes into account fluid typography parameters and attempts to return a css formula depending on available, valid values.
 *
 * The Core PHP equivalent is wp_get_typography_font_size_value().
 *
 * @param {Preset}                     preset
 * @param {Object}                     settings
 * @param {boolean|TypographySettings} settings.typography.fluid  Whether fluid typography is enabled, and, optionally, fluid font size options.
 * @param {?Object}                    settings.typography.layout Layout options.
 *
 * @return {string|*} A font-size value or the value of preset.size.
 */
export function getTypographyFontSizeValue( preset, settings ) {
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

	let fluidTypographySettings =
		getFluidTypographyOptionsFromSettings( settings );
	fluidTypographySettings =
		typeof fluidTypographySettings?.fluid === 'object'
			? fluidTypographySettings?.fluid
			: {};

	const fluidFontSizeValue = getComputedFluidTypographyValue( {
		minimumFontSize: preset?.fluid?.min,
		maximumFontSize: preset?.fluid?.max,
		fontSize: defaultSize,
		minimumFontSizeLimit: fluidTypographySettings?.minFontSize,
		maximumViewportWidth: fluidTypographySettings?.maxViewportWidth,
		minimumViewportWidth: fluidTypographySettings?.minViewportWidth,
	} );

	if ( !! fluidFontSizeValue ) {
		return fluidFontSizeValue;
	}

	return defaultSize;
}

function isFluidTypographyEnabled( typographySettings ) {
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
 * @param {Object} settings            Theme.json settings
 * @param {Object} settings.typography Theme.json typography settings
 * @param {Object} settings.layout     Theme.json layout settings
 * @return {TypographySettings} Fluid typography settings
 */
export function getFluidTypographyOptionsFromSettings( settings ) {
	const typographySettings = settings?.typography;
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
					...typographySettings.fluid,
				},
		  }
		: {
				fluid: typographySettings?.fluid,
		  };
}

/**
 * Returns an object of merged font families and the font faces from the selected font family
 * based on the theme.json settings object and the currently selected font family.
 *
 * @param {Object} settings           Theme.json settings.
 * @param {string} selectedFontFamily Decoded font family string.
 * @return {Object} Merged font families and font faces from the selected font family.
 */
export function getMergedFontFamiliesAndFontFamilyFaces(
	settings,
	selectedFontFamily
) {
	const fontFamiliesFromSettings = settings?.typography?.fontFamilies;

	const fontFamilies = [ 'default', 'theme', 'custom' ].flatMap(
		( key ) => fontFamiliesFromSettings?.[ key ] ?? []
	);

	const fontFamilyFaces =
		fontFamilies.find(
			( family ) => family.fontFamily === selectedFontFamily
		)?.fontFace ?? [];

	return { fontFamilies, fontFamilyFaces };
}

/**
 * Returns the nearest font weight value from the available font weight list based on the new font weight.
 * The nearest font weight is the one with the smallest difference from the new font weight.
 *
 * @param {Array}  availableFontWeights Array of available font weights.
 * @param {string} newFontWeightValue   New font weight value.
 * @return {string} Nearest font weight.
 */
export function findNearestFontWeight(
	availableFontWeights,
	newFontWeightValue
) {
	newFontWeightValue =
		'number' === typeof newFontWeightValue
			? newFontWeightValue.toString()
			: newFontWeightValue;
	if ( ! newFontWeightValue || typeof newFontWeightValue !== 'string' ) {
		return '';
	}

	if ( ! availableFontWeights || availableFontWeights.length === 0 ) {
		return newFontWeightValue;
	}

	const nearestFontWeight = availableFontWeights?.reduce(
		( nearest, { value: fw } ) => {
			const currentDiff = Math.abs(
				parseInt( fw ) - parseInt( newFontWeightValue )
			);
			const nearestDiff = Math.abs(
				parseInt( nearest ) - parseInt( newFontWeightValue )
			);
			return currentDiff < nearestDiff ? fw : nearest;
		},
		availableFontWeights[ 0 ]?.value
	);

	return nearestFontWeight;
}

/**
 * Returns the nearest font style based on the new font style.
 * Defaults to an empty string if the new font style is not valid or available.
 *
 * @param {Array}  availableFontStyles Array of available font weights.
 * @param {string} newFontStyleValue   New font style value.
 * @return {string} Nearest font style or an empty string.
 */
export function findNearestFontStyle( availableFontStyles, newFontStyleValue ) {
	if ( typeof newFontStyleValue !== 'string' || ! newFontStyleValue ) {
		return '';
	}

	const validStyles = [ 'normal', 'italic', 'oblique' ];
	if ( ! validStyles.includes( newFontStyleValue ) ) {
		return '';
	}

	if (
		! availableFontStyles ||
		availableFontStyles.length === 0 ||
		availableFontStyles.find(
			( style ) => style.value === newFontStyleValue
		)
	) {
		return newFontStyleValue;
	}

	if (
		newFontStyleValue === 'oblique' &&
		! availableFontStyles.find( ( style ) => style.value === 'oblique' )
	) {
		return 'italic';
	}

	return '';
}

/**
 * Returns the nearest font style and weight based on the available font family faces and the new font style and weight.
 *
 * @param {Array}  fontFamilyFaces Array of available font family faces.
 * @param {string} fontStyle       New font style. Defaults to previous value.
 * @param {string} fontWeight      New font weight. Defaults to previous value.
 * @return {Object} Nearest font style and font weight.
 */
export function findNearestStyleAndWeight(
	fontFamilyFaces,
	fontStyle,
	fontWeight
) {
	let nearestFontStyle = fontStyle;
	let nearestFontWeight = fontWeight;

	const { fontStyles, fontWeights, combinedStyleAndWeightOptions } =
		getFontStylesAndWeights( fontFamilyFaces );

	// Check if the new font style and weight are available in the font family faces.
	const hasFontStyle = fontStyles?.some(
		( { value: fs } ) => fs === fontStyle
	);
	const hasFontWeight = fontWeights?.some(
		( { value: fw } ) => fw?.toString() === fontWeight?.toString()
	);

	if ( ! hasFontStyle ) {
		/*
		 * Default to italic if oblique is not available.
		 * Or find the nearest font style based on the nearest font weight.
		 */
		nearestFontStyle = fontStyle
			? findNearestFontStyle( fontStyles, fontStyle )
			: combinedStyleAndWeightOptions?.find(
					( option ) =>
						option.style.fontWeight ===
						findNearestFontWeight( fontWeights, fontWeight )
			  )?.style?.fontStyle;
	}

	if ( ! hasFontWeight ) {
		/*
		 * Find the nearest font weight based on available weights.
		 * Or find the nearest font weight based on the nearest font style.
		 */
		nearestFontWeight = fontWeight
			? findNearestFontWeight( fontWeights, fontWeight )
			: combinedStyleAndWeightOptions?.find(
					( option ) =>
						option.style.fontStyle ===
						( nearestFontStyle || fontStyle )
			  )?.style?.fontWeight;
	}

	return { nearestFontStyle, nearestFontWeight };
}
