/**
 * Check if a Rich Text value is Empty, meaning it contains no text or any
 * objects (such as images).
 *
 * @param {Object} value Value to use.
 *
 * @return {boolean} True if the value is empty, false if not.
 */
export function isEmpty( { text } ) {
	return text.length === 0;
}

/**
 * Check if the current collapsed selection is on an empty line in case of a
 * multiline value.
 *
 * @param  {Object} value Value te check.
 *
 * @return {boolean} True if the line is empty, false if not.
 */
export function isEmptyLine( { text, start, end } ) {
	if ( start !== end || start < 2 || start > text.length - 2 ) {
		return false;
	}

	return text.slice( start - 2, end + 2 ) === '\n\n\n\n';
}
