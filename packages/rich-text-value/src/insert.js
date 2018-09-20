/**
 * External dependencies
 */

import { create } from './create';

/**
 * Insert a Rich Text value, an HTML string, or a plain text string, into a
 * Rich Text value at the given `startIndex`. Any content between `startIndex`
 * and `endIndex` will be removed. Indices are retrieved from the selection if
 * none are provided.
 *
 * @param {Object} value         Value to modify.
 * @param {string} valueToInsert Value to insert.
 * @param {number} startIndex    Start index.
 * @param {number} endIndex      End index.
 *
 * @return {Object} A new value with the value inserted.
 */
export function insert(
	{ formats, text, start, end },
	valueToInsert,
	startIndex = start,
	endIndex = end
) {
	if ( typeof valueToInsert === 'string' ) {
		valueToInsert = create( valueToInsert );
	}

	const index = startIndex + valueToInsert.text.length;

	return {
		formats: formats.slice( 0, startIndex ).concat( valueToInsert.formats, formats.slice( endIndex ) ),
		text: text.slice( 0, startIndex ) + valueToInsert.text + text.slice( endIndex ),
		start: index,
		end: index,
	};
}
