import type { RichTextValue } from './types';

/**
 * Slice a Rich Text value from `startIndex` to `endIndex`. Indices are
 * retrieved from the selection if none are provided. This is similar to
 * `String.prototype.slice`.
 *
 * @param value        Value to modify.
 * @param [startIndex] Start index.
 * @param [endIndex]   End index.
 *
 * @return A new extracted value.
 */
export function slice(
	value: RichTextValue,
	startIndex = value.start,
	endIndex = value.end
) {
	const { formats, replacements, text } = value;

	if ( startIndex === undefined || endIndex === undefined ) {
		return { ...value };
	}

	return {
		formats: formats.slice( startIndex, endIndex ),
		replacements: replacements.slice( startIndex, endIndex ),
		text: text.slice( startIndex, endIndex ),
	};
}
