/**
 * Internal dependencies
 */
import { getFontStylesAndWeights } from '../../utils/get-font-styles-and-weights';

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
