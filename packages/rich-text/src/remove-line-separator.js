/**
 * Internal dependencies
 */

import { LINE_SEPARATOR } from './special-characters';
import { isCollapsed } from './is-collapsed';
import { remove } from './remove';

/**
 * Removes a line break character into a Rich Text value at the current
 * indices. If the Any content between `startIndex` and `endIndex` will be
 * removed. Indices are retrieved from the selection if none are provided.
 *
 * @param {Object} value Value to modify.
 * @param {boolean} backward indicates if are removing from the start index or the end index.
 *
 * @return {Object} A new value with the line separator removed. Or undefined if no line separator is found on the position.
 */
export function removeLineSeparator(
	value,
	backward = true,
) {
	const { replacements, text, start, end } = value;
	const collapsed = isCollapsed( value );
	let index = start - 1;
	let removeStart = collapsed ? start - 1 : start;
	let removeEnd = end;
	if ( ! backward ) {
		index = end;
		removeStart = start;
		removeEnd = collapsed ? end + 1 : end;
	}

	if ( text[ index ] !== LINE_SEPARATOR ) {
		return undefined;
	}

	let newValue;
	// If the line separator that is about te be removed
	// contains wrappers, remove the wrappers first.
	if ( collapsed && replacements[ index ] && replacements[ index ].length ) {
		const newReplacements = replacements.slice();

		newReplacements[ index ] = replacements[ index ].slice( 0, -1 );
		newValue = {
			...value,
			replacements: newReplacements,
		};
	} else {
		newValue = remove(
			value,
			removeStart,
			removeEnd
		);
	}
	return newValue;
}
