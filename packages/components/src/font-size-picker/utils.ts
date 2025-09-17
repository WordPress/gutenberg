/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

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
 * Generates hint text for a font size based on its fluid typography properties.
 * This function can be used by consumers to generate hint text for font sizes
 * that have fluid typography properties.
 *
 * @param fontSize The font size object to generate hint text for.
 * @return The generated hint text, or undefined if no hint should be shown.
 */
export function generateFontSizeHint( fontSize: FontSize ): string | undefined {
	// If the font size already has a hint, use it
	if ( fontSize.hint ) {
		return fontSize.hint;
	}

	// Generate hint from fluid typography properties
	if ( fontSize.fluid ) {
		const hasMin = isSimpleCssValue( fontSize.fluid.min ?? '' );
		const hasMax = isSimpleCssValue( fontSize.fluid.max ?? '' );

		if ( hasMin && hasMax ) {
			return sprintf(
				// translators: 1: the minimum fluid font size value, 2: the maximum fluid font size value.
				__( '%1$s - %2$s' ),
				String( fontSize.fluid.min! ),
				String( fontSize.fluid.max! )
			);
		} else if ( hasMin ) {
			return sprintf(
				// translators: %s: the minimum fluid font size value.
				__( '>= %s' ),
				String( fontSize.fluid.min! )
			);
		} else if ( hasMax ) {
			return sprintf(
				// translators: %s: the maximum fluid font size value.
				__( '<= %s' ),
				String( fontSize.fluid.max! )
			);
		}
	}

	// Fallback to showing the size value if it's a simple CSS value
	if ( isSimpleCssValue( fontSize.size ) ) {
		return String( fontSize.size );
	}

	return undefined;
}
