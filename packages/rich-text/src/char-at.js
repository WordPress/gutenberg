/**
 * Gets the character at the specified index, or returns `undefined` if no
 * character was found.
 *
 * @param {Object} value Value to get the character from.
 * @param {string} index Index to use.
 *
 * @return {string|undefined} A one character long string, or undefined.
 */
export function charAt( { text }, index ) {
	return text[ index ];
}
