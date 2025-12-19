export const isValuePreset = ( value, slug ) => {
	if ( ! value?.includes ) {
		return false;
	}

	return value === '0' || value.includes( `var:preset|${ slug }|` );
};

/**
 * Returns the slug section of the given preset string.
 *
 * @param {string} value      Value to extract slug from.
 * @param {string} presetType Preset type slug.
 *
 * @return {string|undefined} The value slug from given preset.
 */
export function getPresetSlug( value, presetType ) {
	if ( ! value ) {
		return;
	}

	if ( value === '0' || value === 'default' ) {
		return value;
	}

	const slug = value.match(
		new RegExp( `var:preset\\|${ presetType }\\|(.+)` )
	);

	return slug ? slug[ 1 ] : undefined;
}

/**
 * Converts preset value into a Range component value .
 *
 * @param {string} presetValue Value to convert to Range value.
 * @param {Array}  presets     Array of current preset value objects.
 * @param {string} presetType  Preset type slug.
 *
 * @return {number} The int value for use in Range control.
 */
export function getSliderValueFromPreset( presetValue, presets, presetType ) {
	if ( presetValue === undefined ) {
		return 0;
	}
	const slug =
		parseFloat( presetValue, 10 ) === 0
			? '0'
			: getPresetSlug( presetValue, presetType );
	const sliderValue = presets.findIndex( ( size ) => {
		return String( size.slug ) === slug;
	} );

	// Returning NaN rather than undefined as undefined makes range control thumb sit in center
	return sliderValue !== -1 ? sliderValue : NaN;
}

/**
 * Converts a preset into a custom value.
 *
 * @param {string} value      Value to convert
 * @param {Array}  presets    Array of the current radius preset objects
 * @param {string} presetType Preset type slug e.g. border-radius
 *
 * @return {string} Mapping of the preset to its equivalent custom value.
 */
export function getCustomValueFromPreset( value, presets, presetType ) {
	if ( ! isValuePreset( value, presetType ) ) {
		return value;
	}

	const slug =
		parseFloat( value, 10 ) === 0
			? '0'
			: getPresetSlug( value, presetType );

	const preset = presets.find( ( size ) => String( size.slug ) === slug );

	return preset?.size;
}

/**
 * Converts a custom value to preset value if one can be found.
 *
 * Returns value as-is if no match is found.
 *
 * @param {string} value        Value to convert
 * @param {Array}  spacingSizes Array of the current spacing preset objects
 * @param {string} presetType   Preset type slug e.g. border-radius
 *
 * @return {string} The preset value if it can be found.
 */
export function getPresetValueFromCustomValue(
	value,
	spacingSizes,
	presetType
) {
	// Return value as-is if it is undefined or is already a preset, or '0';
	if ( ! value || isValuePreset( value, presetType ) || value === '0' ) {
		return value;
	}

	const spacingMatch = spacingSizes.find(
		( size ) => String( size.size ) === String( value )
	);

	if ( spacingMatch?.slug ) {
		return `var:preset|${ presetType }|${ spacingMatch.slug }`;
	}

	return value;
}
