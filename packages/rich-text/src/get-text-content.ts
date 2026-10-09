import { OBJECT_REPLACEMENT_CHARACTER } from './special-characters';
import type { RichTextValue } from './types';

/**
 * Get the textual content of a Rich Text value. This is similar to
 * `Element.textContent`.
 *
 * @param value      Value to use.
 * @param value.text Text of the value.
 *
 * @return The text content.
 */
export function getTextContent( { text }: RichTextValue ) {
	return text.replace( OBJECT_REPLACEMENT_CHARACTER, '' );
}
