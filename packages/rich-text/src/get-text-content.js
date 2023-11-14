/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * Get the textual content of a Rich Text value. This is similar to
 * `Element.textContent`.
 *
 * @deprecated Use the text property instead.
 *
 * @param {RichTextValue} value Value to use.
 *
 * @return {string} The text content.
 */
export function getTextContent( { text } ) {
	return text;
}
