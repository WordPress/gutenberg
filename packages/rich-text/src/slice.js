/** @typedef {import('./types').RichTextValue} RichTextValue */

export function sliceFormats( formats, startIndex, endIndex = Infinity ) {
	return new Map(
		Array.from( formats ).reduce(
			( accumlator, [ format, [ start, end ] ] ) => {
				if ( start >= endIndex || end <= startIndex ) {
					return accumlator;
				}

				const newStart = Math.max( start, startIndex );
				const newEnd = Math.min( end, endIndex );

				accumlator.push( [
					format,
					[ newStart - startIndex, newEnd - startIndex ],
				] );

				return accumlator;
			},
			[]
		)
	);
}

/**
 * Slice a Rich Text value from `startIndex` to `endIndex`. Indices are
 * retrieved from the selection if none are provided. This is similar to
 * `String.prototype.slice`.
 *
 * @param {RichTextValue} value        Value to modify.
 * @param {number}        [startIndex] Start index.
 * @param {number}        [endIndex]   End index.
 *
 * @return {RichTextValue} A new extracted value.
 */
export function slice( value, startIndex = value.start, endIndex = value.end ) {
	const { formats, replacements, text } = value;

	if ( startIndex === undefined || endIndex === undefined ) {
		return { ...value };
	}

	return {
		formats: formats.slice( startIndex, endIndex ),
		_formats: sliceFormats( value._formats, startIndex, endIndex ),
		replacements: replacements.slice( startIndex, endIndex ),
		text: text.slice( startIndex, endIndex ),
	};
}
