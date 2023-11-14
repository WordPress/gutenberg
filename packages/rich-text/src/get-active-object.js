/** @typedef {import('./types').RichTextValue} RichTextValue */
/** @typedef {import('./types').RichTextFormat} RichTextFormat */

/**
 * Gets the active object, if there is any.
 *
 * @param {RichTextValue} value Value to inspect.
 *
 * @return {RichTextFormat|void} Active object, or undefined.
 */
export function getActiveObject( { start, end, replacements } ) {
	if ( start + 1 !== end || replacements[ start ] ) {
		return;
	}

	return replacements[ start ];
}
