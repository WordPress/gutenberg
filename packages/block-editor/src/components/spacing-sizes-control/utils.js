/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

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
	return value.includes( 'var:preset|spacing|' );
}

/**
 * Converts a spacing preset into a custom value.
 *
 * @param {string}  value Value to convert
 * @param {Array}   spacingSizes Array of the current spacing preset objects
 *
 * @return {string} Mapping of the spacing preset to its equivalent custom value.
 */
export function getCustomValueFromPreset( value, spacingSizes ) {
	if ( ! isValueSpacingPreset( value ) ) {
		return value;
	}

	const slug = getSpacingPresetSlug( value );
	const spacingSize = spacingSizes.find( ( size ) => size.slug === slug );

	return spacingSize?.size;
}

/**
 * Converts a spacing preset into a custom value.
 *
 * @param {string} value Value to convert.
 *
 * @return {string} CSS var string for given spacing preset value.
 */
export function getSpacingPresetCssVar( value ) {
	if ( ! value ) {
		return;
	}
	const slug = /var:preset\|spacing\|(.+)/.exec( value );
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
 * @return {number} The int value of the slug from given spacing preset.
 */
export function getSpacingPresetSlug( value ) {
	if ( ! value ) {
		return;
	}

	if ( value === '0' || value === 'default' ) {
		return value;
	}

	const slug = /var:preset\|spacing\|(.+)/.exec( value );

	return slug ? parseInt( slug[ 1 ], 10 ) : undefined;
}

/**
 * Converts spacing preset value into a Range component value .
 *
 * @param {string}  presetValue Value to convert to Range value.
 * @param {Array}   spacingSizes Array of current spacing preset vaue objects.
 *
 * @return {number} The int value for use in Range control.
 */
export function getSliderValueFromPreset( presetValue, spacingSizes ) {
	const slug = getSpacingPresetSlug( presetValue );
	const sliderValue = spacingSizes.findIndex( ( spacingSize ) => {
		return spacingSize.slug === slug;
	} );
	return sliderValue !== -1 ? sliderValue : undefined;
}

export const LABELS = {
	all: __( 'All sides' ),
	top: __( 'Top' ),
	bottom: __( 'Bottom' ),
	left: __( 'Left' ),
	right: __( 'Right' ),
	mixed: __( 'Mixed' ),
	vertical: __( 'Vertical sides' ),
	horizontal: __( 'Horizontal sides' ),
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
 *
 * @return {boolean} Whether values are mixed.
 */
export function isValuesMixed( values = {} ) {
	return new Set( Object.values( values ) ).size > 1;
}

/**
 * Checks to determine if values are defined.
 *
 * @param {Object} values Box values.
 *
 * @return {boolean} Whether values are defined.
 */
export function isValuesDefined( values ) {
	return (
		values !== undefined &&
		! isEmpty(
			Object.values( values ).filter(
				// Switching units when input is empty causes values only
				// containing units. This gives false positive on mixed values
				// unless filtered.
				( value ) => !! value && /\d/.test( value )
			)
		)
	);
}
