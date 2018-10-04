/**
 * Internal dependencies
 */

import { create } from './create';
import { normaliseFormats } from './normalise-formats';

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
	{ _formats, _text, _start, _end },
	valueToInsert,
	startIndex = _start,
	endIndex = _end
) {
	if ( typeof valueToInsert === 'string' ) {
		valueToInsert = create( { text: valueToInsert } );
	}

	const index = startIndex + valueToInsert._text.length;

	return normaliseFormats( {
		_formats: _formats.slice( 0, startIndex ).concat( valueToInsert._formats, _formats.slice( endIndex ) ),
		_text: _text.slice( 0, startIndex ) + valueToInsert._text + _text.slice( endIndex ),
		_start: index,
		_end: index,
	} );
}
