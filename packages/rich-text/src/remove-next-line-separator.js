/**
 * Internal dependencies
 */

import { remove } from './remove';
import { LINE_SEPARATOR } from './special-characters';

/**
 * Remove a line break character from a Rich Text value at the given
 * `startIndex`. The character will be removed only if it is right before the
 * `startIndex`, otherwise `undefined` will be returned. Any content between
 * `startIndex` and `endIndex` will also be removed. Indices are retrieved from
 * the selection if none are provided.
 *
 * @param {Object} value         Value to modify.
 * @param {number} startIndex    Start index.
 * @param {number} endIndex      End index.
 *
 * @return {?Object} A new value if the separator can be removed, undefined
 *                   otherwise.
 */
export function removeNextLineSeparator(
	value,
	startIndex = value.start,
	endIndex = value.end,
) {
	const nextIndex = endIndex;

	// Cannot remove the line if the next index is not a line separator.
	if ( value.text[ nextIndex ] !== LINE_SEPARATOR ) {
		return;
	}

	return remove( value, startIndex, nextIndex + 1 );
}
