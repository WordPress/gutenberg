/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Checks is given value is a spacing preset.
 *
 * @param {string} value Value to check
 *
 * @return {boolean} Return true if value is string in format var:preset|spacing|.
 */
export function isValueSpacingPreset( value ) {
	if ( ! value?.includes ) {
		return false;
	}
	return value === '0' || value.includes( 'var:preset|spacing|' );
}

/**
 * Converts a spacing preset into a custom value.
 *
 * @param {string} value        Value to convert
 * @param {Array}  spacingSizes Array of the current spacing preset objects
 *
 * @return {string} Mapping of the spacing preset to its equivalent custom value.
 */
export function getCustomValueFromPreset( value, spacingSizes ) {
	if ( ! isValueSpacingPreset( value ) ) {
		return value;
	}

	const slug = getSpacingPresetSlug( value );
	const spacingSize = spacingSizes.find(
		( size ) => String( size.slug ) === slug
	);

	return spacingSize?.size;
}

/**
 * Converts a custom value to preset value if one can be found.
 *
 * Returns value as-is if no match is found.
 *
 * @param {string} value        Value to convert
 * @param {Array}  spacingSizes Array of the current spacing preset objects
 *
 * @return {string} The preset value if it can be found.
 */
export function getPresetValueFromCustomValue( value, spacingSizes ) {
	// Return value as-is if it is already a preset;
	if ( isValueSpacingPreset( value ) ) {
		return value;
	}

	const spacingMatch = spacingSizes.find(
		( size ) => String( size.size ) === String( value )
	);

	if ( spacingMatch?.slug ) {
		return `var:preset|spacing|${ spacingMatch.slug }`;
	}

	return value;
}

/**
 * Converts a spacing preset into a custom value.
 *
 * @param {string} value Value to convert.
 *
 * @return {string | undefined} CSS var string for given spacing preset value.
 */
export function getSpacingPresetCssVar( value ) {
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
 * Returns the slug section of the given spacing preset string.
 *
 * @param {string} value Value to extract slug from.
 *
 * @return {string|undefined} The int value of the slug from given spacing preset.
 */
export function getSpacingPresetSlug( value ) {
	if ( ! value ) {
		return;
	}

	if ( value === '0' || value === 'default' ) {
		return value;
	}

	const slug = value.match( /var:preset\|spacing\|(.+)/ );

	return slug ? slug[ 1 ] : undefined;
}

/**
 * Converts spacing preset value into a Range component value .
 *
 * @param {string} presetValue  Value to convert to Range value.
 * @param {Array}  spacingSizes Array of current spacing preset value objects.
 *
 * @return {number} The int value for use in Range control.
 */
export function getSliderValueFromPreset( presetValue, spacingSizes ) {
	if ( presetValue === undefined ) {
		return 0;
	}
	const slug =
		parseFloat( presetValue, 10 ) === 0
			? '0'
			: getSpacingPresetSlug( presetValue );
	const sliderValue = spacingSizes.findIndex( ( spacingSize ) => {
		return String( spacingSize.slug ) === slug;
	} );

	// Returning NaN rather than undefined as undefined makes range control thumb sit in center
	return sliderValue !== -1 ? sliderValue : NaN;
}

export const LABELS = {
	all: __( 'All sides' ),
	top: __( 'Top' ),
	bottom: __( 'Bottom' ),
	left: __( 'Left' ),
	right: __( 'Right' ),
	mixed: __( 'Mixed' ),
	vertical: __( 'Vertical' ),
	horizontal: __( 'Horizontal' ),
};

export const DEFAULT_VALUES = {
	top: undefined,
	right: undefined,
	bottom: undefined,
	left: undefined,
};

export const ALL_SIDES = [ 'top', 'right', 'bottom', 'left' ];

/**
 * Gets an items with the most occurrence within an array
 * https://stackoverflow.com/a/20762713
 *
 * @param {Array<any>} arr Array of items to check.
 * @return {any} The item with the most occurrences.
 */
function mode( arr ) {
	return arr
		.sort(
			( a, b ) =>
				arr.filter( ( v ) => v === a ).length -
				arr.filter( ( v ) => v === b ).length
		)
		.pop();
}

/**
 * Gets the 'all' input value from values data.
 *
 * @param {Object} values Box spacing values
 *
 * @return {string} The most common value from all sides of box.
 */
export function getAllRawValue( values = {} ) {
	return mode( Object.values( values ) );
}

/**
 * Checks to determine if values are mixed.
 *
 * @param {Object} values Box values.
 * @param {Array}  sides  Sides that values relate to.
 *
 * @return {boolean} Whether values are mixed.
 */
export function isValuesMixed( values = {}, sides = ALL_SIDES ) {
	return (
		( Object.values( values ).length >= 1 &&
			Object.values( values ).length < sides.length ) ||
		new Set( Object.values( values ) ).size > 1
	);
}

/**
 * Checks to determine if values are defined.
 *
 * @param {Object} values Box values.
 *
 * @return {boolean} Whether values are defined.
 */
export function isValuesDefined( values ) {
	if ( values === undefined || values === null ) {
		return false;
	}
	return Object.values( values ).filter( ( value ) => !! value ).length > 0;
}
