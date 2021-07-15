/**
 * Internal dependencies
 */
import {
	OBJECT_REPLACEMENT_CHARACTER,
	LINE_SEPARATOR,
} from './special-characters';

/** @typedef {import('./create').RichTextValue} RichTextValue */

/**
 * Get the textual content of a Rich Text value. This is similar to
 * `Element.textContent`.
 *
 * @param {RichTextValue} value Value to use.
 *
 * @return {string} The text content.
 */
export function getTextContent( { text } ) {
	return text
		.replace( new RegExp( OBJECT_REPLACEMENT_CHARACTER, 'g' ), '' )
		.replace( new RegExp( LINE_SEPARATOR, 'g' ), '\n' );
}
