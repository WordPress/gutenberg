/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/** @typedef {import('./register-format-type').RichTextFormatType} RichTextFormatType */

/**
 * Returns a registered format type.
 *
 * @param {string} name Format name.
 *
 * @return {RichTextFormatType|undefined} Format type.
 */
export function getFormatType( name ) {
	return select( 'core/rich-text' ).getFormatType( name );
}
