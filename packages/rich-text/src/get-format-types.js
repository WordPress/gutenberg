import { select } from '@wordpress/data';
import { store as richTextStore } from './store';

/** @typedef {import('./register-format-type').RichTextFormatType} RichTextFormatType */

/**
 * Returns all registered formats.
 *
 * @return {Array<RichTextFormatType>} Format settings.
 */
export function getFormatTypes() {
	return select( richTextStore ).getFormatTypes();
}
