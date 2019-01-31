/**
 * Internal dependencies
 */

import { LINE_SEPARATOR } from './special-characters';

/**
 * Gets the index of the first parent list. To get the parent list formats, we
 * go through every list item until we find one with exactly one format type
 * less.
 *
 * @param {Object} value     Value to search.
 * @param {number} lineIndex Line index of a child list item.
 *
 * @return {Array} The parent list line index.
 */
export function getParentLineIndex( { text, formats }, lineIndex ) {
	const startFormats = formats[ lineIndex ] || [];

	let index = lineIndex;

	while ( index-- >= 0 ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		const formatsAtIndex = formats[ index ] || [];

		if ( formatsAtIndex.length === startFormats.length - 1 ) {
			return index;
		}
	}
}
