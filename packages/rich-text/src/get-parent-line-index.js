/**
 * Internal dependencies
 */

import { LINE_SEPARATOR } from './special-characters';

/** @typedef {import('./create').RichTextValue} RichTextValue */

/**
 * Gets the index of the first parent list. To get the parent list formats, we
 * go through every list item until we find one with exactly one format type
 * less.
 *
 * @param {RichTextValue} value     Value to search.
 * @param {number}        lineIndex Line index of a child list item.
 *
 * @return {number|void} The parent list line index.
 */
export function getParentLineIndex( { text, replacements }, lineIndex ) {
	const startFormats = replacements[ lineIndex ] || [];

	let index = lineIndex;

	while ( index-- >= 0 ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		const formatsAtIndex = replacements[ index ] || [];

		if ( formatsAtIndex.length === startFormats.length - 1 ) {
			return index;
		}
	}
}
