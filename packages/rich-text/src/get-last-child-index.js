/**
 * Internal dependencies
 */

import { LINE_SEPARATOR } from './special-characters';

/**
 * Gets the line index of the last child in the list.
 *
 * @param {Object} value     Value to search.
 * @param {number} lineIndex Line index of a list item in the list.
 *
 * @return {Array} The index of the last child.
 */
export function getLastChildIndex( { text, formats }, lineIndex ) {
	const lineFormats = formats[ lineIndex ] || [];
	// Use the given line index in case there are no next children.
	let childIndex = lineIndex;

	// `lineIndex` could be `undefined` if it's the first line.
	for ( let index = lineIndex || 0; index < text.length; index++ ) {
		// We're only interested in line indices.
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		const formatsAtIndex = formats[ index ] || [];

		// If the amout of formats is equal or more, store it, then return the
		// last one if the amount of formats is less.
		if ( formatsAtIndex.length >= lineFormats.length ) {
			childIndex = index;
		} else {
			return childIndex;
		}
	}

	// If the end of the text is reached, return the last child index.
	return childIndex;
}
