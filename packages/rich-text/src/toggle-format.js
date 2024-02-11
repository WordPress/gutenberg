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

/** @typedef {import('./types').RichTextValue} RichTextValue */
/** @typedef {import('./types').RichTextFormat} RichTextFormat */

/**
 * Toggles a format object to a Rich Text value at the current selection.
 *
 * @param {RichTextValue}  value      Value to modify.
 * @param {RichTextFormat} format     Format to apply or remove.
 * @param {number}         startIndex Start index.
 * @param {number}         endIndex   End index.
 * @return {RichTextValue} A new value with the format applied or removed.
 */
export function toggleFormat( value, format, startIndex, endIndex ) {
	if ( getActiveFormat( value, format.type, startIndex, endIndex ) ) {
		// For screen readers, will announce if formatting control is disabled.
		if ( format.title ) {
			// translators: %s: title of the formatting control
			speak( sprintf( __( '%s removed.' ), format.title ), 'assertive' );
		}
		return removeFormat( value, format.type, startIndex, endIndex );
	}
	// For screen readers, will announce if formatting control is enabled.
	if ( format.title ) {
		// translators: %s: title of the formatting control
		speak( sprintf( __( '%s applied.' ), format.title ), 'assertive' );
	}
	return applyFormat( value, format, startIndex, endIndex );
}
