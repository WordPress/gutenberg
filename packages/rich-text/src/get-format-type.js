/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { store as richTextStore } from './store';

/** @typedef {import('./register-format-type').RichTextFormatType} RichTextFormatType */

/**
 * Returns a registered format type.
 *
 * @param {string} name Format name.
 *
 * @return {RichTextFormatType|undefined} Format type.
 */
export function getFormatType( name ) {
	return select( richTextStore ).getFormatType( name );
}
