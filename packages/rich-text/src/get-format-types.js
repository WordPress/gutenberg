/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/** @typedef {import('./register-format-type').RichTextFormatType} RichTextFormatType */

/**
 * Returns all registered formats.
 *
 * @return {Array<RichTextFormatType>} Format settings.
 */
export function getFormatTypes() {
	return select( 'core/rich-text' ).getFormatTypes();
}
