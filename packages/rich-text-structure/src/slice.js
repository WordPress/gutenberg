/**
 * Extracts a section of a record and returns it as a new record.
 *
 * Works like `String.prototype.slice()`.
 *
 * @param {Object} record      Record to modify.
 * @param {number} startIndex  Start index.
 * @param {number} endIndex    End index.
 *
 * @return {Object} A new extracted record.
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
