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
	{ _formats, _text, _start, _end },
	startIndex = _start,
	endIndex = _end
) {
	if ( startIndex === undefined || endIndex === undefined ) {
		return { _formats, _text };
	}

	return {
		_formats: _formats.slice( startIndex, endIndex ),
		_text: _text.slice( startIndex, endIndex ),
	};
}
