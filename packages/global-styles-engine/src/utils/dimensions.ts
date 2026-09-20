import { getCSSValueFromRawStyle } from '@wordpress/style-engine';

/**
 * Converts a raw dimension style value into the CSS value to output.
 *
 * A preset reference such as `var:preset|dimension|wideColumn` becomes the
 * custom property it was declared as, `var(--wp--preset--dimension--wide-column)`.
 * Anything else is returned unchanged.
 *
 * @param value Raw dimension style value.
 *
 * @return CSS value, or undefined when there is none.
 */
export function getDimensionPresetCssVar( value?: string ) {
	if ( ! value ) {
		return;
	}

	return getCSSValueFromRawStyle( value );
}
