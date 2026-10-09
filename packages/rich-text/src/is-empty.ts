import type { RichTextValue } from './types';

/**
 * Check if a Rich Text value is Empty, meaning it contains no text or any
 * objects (such as images).
 *
 * @param {RichTextValue} value Value to use.
 *
 * @return {boolean} True if the value is empty, false if not.
 */
export function isEmpty( { text }: RichTextValue ) {
	return text.length === 0;
}
