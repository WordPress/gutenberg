/**
 * External dependencies
 */

import { create } from './create';

/**
 * Inserts the second given record into the first.
 * The value in between the start and end indices will be removed.
 * If no start index or end index is provided, the record's selection will be
 * used.
 *
 * @param {Object} record         Record to modify.
 * @param {string} recordToInsert Record to insert.
 * @param {number} startIndex     Start index.
 * @param {number} endIndex       End index.
 *
 * @return {Object} A new record with the record inserted.
 */
export function insert(
	{ formats, text, start, end },
	recordToInsert,
	startIndex = start,
	endIndex = end
) {
	if ( typeof recordToInsert === 'string' ) {
		recordToInsert = create( recordToInsert );
	}

	const index = startIndex + recordToInsert.text.length;

	return {
		formats: formats.slice( 0, startIndex ).concat( recordToInsert.formats, formats.slice( endIndex ) ),
		text: text.slice( 0, startIndex ) + recordToInsert.text + text.slice( endIndex ),
		start: index,
		end: index,
	};
}
