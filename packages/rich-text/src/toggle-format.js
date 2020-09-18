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
 *
 * @return {RichTextValue} A new value with the format applied or removed.
 */
export function toggleFormat( value, format ) {
	if ( getActiveFormat( value, format.type ) ) {
		return removeFormat( value, format.type );
	}

	return applyFormat( value, format );
}
