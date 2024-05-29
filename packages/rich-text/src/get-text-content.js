/**
 * Internal dependencies
 */
import { OBJECT_REPLACEMENT_CHARACTER } from './special-characters';

/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * Get the textual content of a Rich Text value. This is similar to
 * `Element.textContent`.
 *
 * @param {RichTextValue} value Value to use.
 *
 * @return {string} The text content.
 */
export function getTextContent( { text } ) {
	return text.replace( OBJECT_REPLACEMENT_CHARACTER, '' );
}
