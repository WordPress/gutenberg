/**
 * Internal dependencies
 */
import type { FontSizePickerProps } from './types';

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
	const sizeRegex =
		/^[\d\.]+(px|em|rem|vw|vh|%|svw|lvw|dvw|svh|lvh|dvh|vi|svi|lvi|dvi|vb|svb|lvb|dvb|vmin|svmin|lvmin|dvmin|vmax|svmax|lvmax|dvmax)?$/i;
	return sizeRegex.test( String( value ) );
}
