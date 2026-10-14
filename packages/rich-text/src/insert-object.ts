import { insert } from './insert';
import { OBJECT_REPLACEMENT_CHARACTER } from './special-characters';
import type {
	RichTextFormat,
	RichTextFormatList,
	RichTextValue,
} from './types';

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
export function insertObject(
	value: RichTextValue,
	formatToInsert: RichTextFormat,
	startIndex?: number,
	endIndex?: number
) {
	const valueToInsert = {
		formats: Array< RichTextFormatList >( 1 ),
		replacements: [ formatToInsert ],
		text: OBJECT_REPLACEMENT_CHARACTER,
	};

	return insert( value, valueToInsert, startIndex, endIndex );
}
