/**
 * WordPress dependencies
 */

import { speak } from '@wordpress/a11y';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import { getActiveFormat } from './get-active-format';
import { removeFormat } from './remove-format';
import { applyFormat } from './apply-format';

/** @typedef {import('./create').RichTextValue} RichTextValue */
/** @typedef {import('./create').RichTextFormat} RichTextFormat */

/**
 * Toggles a format object to a Rich Text value at the current selection.
 *
 * @param {RichTextValue}  value  Value to modify.
 * @param {RichTextFormat} format Format to apply or remove.
 * @param {string} title Title of formatting control.
 *
 * @return {RichTextValue} A new value with the format applied or removed.
 */
export function toggleFormat( value, format, title ) {
	if ( getActiveFormat( value, format.type ) ) {
		// For screen readers, will announce if formatting control is disabled.
		if ( title ) {
			// translators: %s: title of the formatting control
			speak( sprintf( __( '%s removed.' ), title ), 'assertive' );
		}
		return removeFormat( value, format.type );
	}
	// For screen readers, will announce if formatting control is enabled.
	if ( title ) {
		// translators: %s: title of the formatting control
		speak( sprintf( __( '%s applied.' ), title ), 'assertive' );
	}
	return applyFormat( value, format );
}
