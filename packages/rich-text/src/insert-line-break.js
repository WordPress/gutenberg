/**
 * Internal dependencies
 */

import { insert } from './insert';
import { LINE_SEPARATOR } from './special-characters';

/**
 * Inserts a line break at the given or selected position. Inserts two line
 * breaks if at the end of a line.
 *
 * @param {Object} value Value to modify.
 *
 * @return {Object} The value with the line break(s) inserted.
 */
export function insertLineBreak( value ) {
	const { text, end } = value;
	const length = text.length;

	let toInsert = '\n';

	// If the caret is at the end of the text, and there is no
	// trailing line break or no text at all, we have to insert two
	// line breaks in order to create a new line visually and place
	// the caret there.
	if (
		( end === length || text[ end ] === LINE_SEPARATOR ) &&
		( text[ end - 1 ] !== '\n' || length === 0 )
	) {
		toInsert = '\n\n';
	}

	return insert( value, toInsert );
}
