/**
 * Internal dependencies
 */

import { LINE_SEPARATOR } from './special-characters';
import { getLineIndex } from './get-line-index';
import { getParentLineIndex } from './get-parent-line-index';

/**
 * Changes the list type of the selected indented list, if any. Looks at the
 * currently selected list item and takes the parent list, then changes the list
 * type of this list. When multiple lines are selected, the parent lists are
 * takes and changed.
 *
 * @param {Object} value     Value to change.
 * @param {Object} newFormat The new list format object. Choose between
 *                           `{ type: 'ol' }` and `{ type: 'ul' }`.
 *
 * @return {Object} The changed value.
 */
export function changeListType( value, newFormat ) {
	const { text, replacements, start, end } = value;
	const startingLineIndex = getLineIndex( value, start );
	const startLineFormats = replacements[ startingLineIndex ] || [];
	const endLineFormats = replacements[ getLineIndex( value, end ) ] || [];
	const startIndex = getParentLineIndex( value, startingLineIndex );
	const newReplacements = replacements.slice();
	const startCount = startLineFormats.length - 1;
	const endCount = endLineFormats.length - 1;

	let changed;

	for ( let index = startIndex + 1 || 0; index < text.length; index++ ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		if ( ( newReplacements[ index ] || [] ).length <= startCount ) {
			break;
		}

		if ( ! newReplacements[ index ] ) {
			continue;
		}

		changed = true;
		newReplacements[ index ] = newReplacements[ index ].map( ( format, i ) => {
			return i < startCount || i > endCount ? format : newFormat;
		} );
	}

	if ( ! changed ) {
		return value;
	}

	return {
		...value,
		replacements: newReplacements,
	};
}
