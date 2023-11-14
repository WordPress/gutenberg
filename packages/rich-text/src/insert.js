/**
 * Internal dependencies
 */

import { create } from './create';
import { slice } from './slice';
import { concat } from './concat';

/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * Insert a Rich Text value, an HTML string, or a plain text string, into a
 * Rich Text value at the given `startIndex`. Any content between `startIndex`
 * and `endIndex` will be removed. Indices are retrieved from the selection if
 * none are provided.
 *
 * @param {RichTextValue}        value         Value to modify.
 * @param {RichTextValue|string} valueToInsert Value to insert.
 * @param {number}               [startIndex]  Start index.
 * @param {number}               [endIndex]    End index.
 *
 * @return {RichTextValue} A new value with the value inserted.
 */
export function insert(
	value,
	valueToInsert,
	startIndex = value.start,
	endIndex = value.end
) {
	if ( typeof valueToInsert === 'string' ) {
		valueToInsert = create( { text: valueToInsert } );
	}

	const index = startIndex + valueToInsert.text.length;
	const newValue = concat(
		slice( value, 0, startIndex ),
		valueToInsert,
		slice( value, endIndex, value.text.length )
	);

	newValue.start = index;
	newValue.end = index;

	return newValue;
}
