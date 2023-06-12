/**
 * Internal dependencies
 */

import { insert } from './insert';
import { OBJECT_REPLACEMENT_CHARACTER } from './special-characters';

/** @typedef {import('./types').RichTextValue} RichTextValue */
/** @typedef {import('./types').RichTextFormat} RichTextFormat */

/**
 * Insert a format as an object into a Rich Text value at the given
 * `startIndex`. Any content between `startIndex` and `endIndex` will be
 * removed. Indices are retrieved from the selection if none are provided.
 *
 * @param {RichTextValue}  value          Value to modify.
 * @param {RichTextFormat} formatToInsert Format to insert as object.
 * @param {number}         [startIndex]   Start index.
 * @param {number}         [endIndex]     End index.
 *
 * @return {RichTextValue} A new value with the object inserted.
 */
export function insertObject( value, formatToInsert, startIndex, endIndex ) {
	const valueToInsert = {
		formats: [ , ],
		replacements: [ formatToInsert ],
		text: OBJECT_REPLACEMENT_CHARACTER,
	};

	return insert( value, valueToInsert, startIndex, endIndex );
}
