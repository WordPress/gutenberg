/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { FontSizePickerProps, FontSize } from './types';
import { parseQuantityAndUnitFromRawValue } from '../unit-control';

/**
 * Some themes use css vars for their font sizes, so until we
 * have the way of calculating them don't display them.
 *
 * @param value The value that is checked.
 * @return Whether the value is a simple css value.
 */
export function isSimpleCssValue(
	value: NonNullable< FontSizePickerProps[ 'value' ] >
) {
	const sizeRegex = /^[\d\.]+(px|em|rem|vw|vh|%)?$/i;
	return sizeRegex.test( String( value ) );
}

/**
 * If all of the given font sizes have the same unit (e.g. 'px'), return that
 * unit. Otherwise return null.
 *
 * @param fontSizes List of font sizes.
 * @return The common unit, or null.
 */
export function getCommonSizeUnit( fontSizes: FontSize[] ) {
	const [ firstFontSize, ...otherFontSizes ] = fontSizes;
	if ( ! firstFontSize ) {
		return null;
	}
	const [ , firstUnit ] = parseQuantityAndUnitFromRawValue(
		firstFontSize.size
	);
	const areAllSizesSameUnit = otherFontSizes.every( ( fontSize ) => {
		const [ , unit ] = parseQuantityAndUnitFromRawValue( fontSize.size );
		return unit === firstUnit;
	} );
	return areAllSizesSameUnit ? firstUnit : null;
}
