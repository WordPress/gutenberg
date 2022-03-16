/**
 * Internal dependencies
 */

import { LINE_SEPARATOR } from './special-characters';

/** @typedef {import('./create').RichTextValue} RichTextValue */

/**
 * Gets the currently selected line index, or the first line index if the
 * selection spans over multiple items.
 *
 * @param {RichTextValue} value      Value to get the line index from.
 * @param {boolean}       startIndex Optional index that should be contained by
 *                                   the line. Defaults to the selection start
 *                                   of the value.
 *
 * @return {number|void} The line index. Undefined if not found.
 */
export function getLineIndex( { start, text }, startIndex = start ) {
	const NEW_LINE_CHARACTER = '\n';
	let index = startIndex;

	while ( index-- ) {
		if (
			text[ index ] === LINE_SEPARATOR ||
			text[ index ] === NEW_LINE_CHARACTER
		) {
			return index;
		}
	}
}
