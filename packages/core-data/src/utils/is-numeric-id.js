/**
 * Checks a given string to determine if it's a numeric ID.
 * For example, '123' is a numeric ID, but '123abc' is not.
 *
 * @param {string} str the string to determine if it's a numeric ID.
 * @return {boolean} true if the string is a numeric ID, false otherwise.
 */
export default function isNumericID( str = '' ) {
	return /^\s*\d+\s*$/.test( str );
}
