/**
 * Slice a Rich Text value from `startIndex` to `endIndex`. Indices are
 * retrieved from the selection if none are provided. This is similar to
 * `String.prototype.slice`.
 *
 * @param {Object} value       Value to modify.
 * @param {number} startIndex  Start index.
 * @param {number} endIndex    End index.
 *
 * @return {Object} A new extracted value.
 */
export function slice(
	{ formats, text, start, end },
	startIndex = start,
	endIndex = end
) {
	if ( startIndex === undefined || endIndex === undefined ) {
		return { formats, text };
	}

	return {
		formats: formats.slice( startIndex, endIndex ),
		text: text.slice( startIndex, endIndex ),
	};
}
