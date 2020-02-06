/**
 * Internal dependencies
 */
import { create } from './create';

/**
 * Removes any HTML tags from the provided string.
 *
 * @param {string} html The string containing html.
 *
 * @return {string} The text content with any html removed.
 */
export function toPlainText( html ) {
	if ( ! html ) {
		return '';
	}

	return create( { html } ).text;
}
