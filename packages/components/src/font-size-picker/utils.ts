/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { FontSizePickerProps } from './types';

/**
 * Helper util to split a font size to its numeric value
 * and its `unit`, if exists.
 *
 * @param  size Font size.
 * @return An array with the numeric value and the unit if exists.
 */
export function splitValueAndUnitFromSize(
	size: NonNullable< FontSizePickerProps[ 'value' ] >
) {
	const [ numericValue, unit ] = `${ size }`.match( /[\d\.]+|\D+/g ) ?? [];

	if (
		! isNaN( parseFloat( numericValue ) ) &&
		isFinite( Number( numericValue ) )
	) {
		return [ numericValue, unit ];
	}

	return [];
}

/**
 * Some themes use css vars for their font sizes, so until we
 * have the way of calculating them don't display them.
 *
 * @param  value The value that is checked.
 * @return Whether the value is a simple css value.
 */
export function isSimpleCssValue(
	value: NonNullable< FontSizePickerProps[ 'value' ] >
) {
	const sizeRegex = /^[\d\.]+(px|em|rem|vw|vh|%)?$/i;
	return sizeRegex.test( String( value ) );
}
