/**
 * Internal dependencies
 */

import { LINE_SEPARATOR } from './special-characters';
import { isCollapsed } from './is-collapsed';
import { remove } from './remove';

/**
 * Removes a line separator character, if existing, from a Rich Text value at the current
 * indices. If no line separator exists on the indices it will return undefined.
 *
 * @param {Object} value Value to modify.
 * @param {boolean} backward indicates if are removing from the start index or the end index.
 *
 * @return {Object|undefined} A new value with the line separator removed. Or undefined if no line separator is found on the position.
 */
export function removeLineSeparator( value, backward = true ) {
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
		return;
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
		newValue = remove( value, removeStart, removeEnd );
	}
	return newValue;
}
