/**
 * Internal dependencies
 */

import { getTextContent } from './get-text-content';
import { insert } from './insert';
import { LINE_SEPARATOR } from './special-characters';

/**
 * Insert a line break character into a Rich Text value at the given
 * `startIndex`. Any content between `startIndex` and `endIndex` will be
 * removed. Indices are retrieved from the selection if none are provided.
 *
 * @param {Object} value        Value to modify.
 * @param {number} [startIndex] Start index.
 * @param {number} [endIndex]   End index.
 *
 * @return {Object} A new value with the value inserted.
 */
export function insertLineSeparator(
	value,
	startIndex = value.start,
	endIndex = value.end,
) {
	const beforeText = getTextContent( value ).slice( 0, startIndex );
	const previousLineSeparatorIndex = beforeText.lastIndexOf( LINE_SEPARATOR );
	const previousLineSeparatorFormats = value.replacements[ previousLineSeparatorIndex ];
	let replacements = [ , ];

	if ( previousLineSeparatorFormats ) {
		replacements = [ previousLineSeparatorFormats ];
	}

	const valueToInsert = {
		formats: [ , ],
		replacements,
		text: LINE_SEPARATOR,
	};

	return insert( value, valueToInsert, startIndex, endIndex );
}
