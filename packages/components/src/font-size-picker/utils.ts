/**
 * Internal dependencies
 */
import type { FontSizePickerProps, FontSize } from './types';

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

/**
 * Generates hint text for a font size.
 * This function returns the hint provided by the consumer, if any.
 * If no hint is provided, it falls back to showing the size value for simple CSS values.
 *
 * @param fontSize The font size object to generate hint text for.
 * @return The hint text provided by the consumer, or the size value for simple CSS values, or undefined.
 */
export function generateFontSizeHint( fontSize: FontSize ): string | undefined {
	// If the font size already has a hint, use it
	if ( fontSize.hint ) {
		return fontSize.hint;
	}

	// Fallback to showing the size value if it's a simple CSS value
	if ( isSimpleCssValue( fontSize.size ) ) {
		return String( fontSize.size );
	}

	return undefined;
}
