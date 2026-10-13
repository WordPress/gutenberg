import { speak } from '@wordpress/a11y';
import { __, sprintf } from '@wordpress/i18n';
import { getActiveFormat } from './get-active-format';
import { removeFormat } from './remove-format';
import { applyFormat } from './apply-format';
import type { RichTextFormat, RichTextValue } from './types';

/**
 * Toggles a format object to a Rich Text value at the current selection.
 *
 * @param value  Value to modify.
 * @param format Format to apply or remove.
 *
 * @return A new value with the format applied or removed.
 */
export function toggleFormat( value: RichTextValue, format: RichTextFormat ) {
	if ( getActiveFormat( value, format.type ) ) {
		// For screen readers, will announce if formatting control is disabled.
		if ( format.title ) {
			// translators: %s: title of the formatting control
			speak( sprintf( __( '%s removed.' ), format.title ), 'assertive' );
		}
		return removeFormat( value, format.type );
	}
	// For screen readers, will announce if formatting control is enabled.
	if ( format.title ) {
		// translators: %s: title of the formatting control
		speak( sprintf( __( '%s applied.' ), format.title ), 'assertive' );
	}
	return applyFormat( value, format );
}
