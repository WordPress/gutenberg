import { OBJECT_REPLACEMENT_CHARACTER } from './special-characters';
import type { RichTextValue } from './types';

/**
 * Get the textual content of a Rich Text value. This is similar to
 * `Element.textContent`.
 *
 * @param {Pick<RichTextValue, 'text'>} value Value to use.
 *
 * @return {string} The text content.
 */
export function getTextContent( { text }: Pick< RichTextValue, 'text' > ) {
	return text.replace( OBJECT_REPLACEMENT_CHARACTER, '' );
}
