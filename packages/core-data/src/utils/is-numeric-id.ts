/**
 * Checks argument to determine if it's a numeric ID.
 * For example, '123' is a numeric ID, but '123abc' is not.
 *
 * @param {any} id the argument to determine if it's a numeric ID.
 * @return {boolean} true if the string is a numeric ID, false otherwise.
 */
export default function isNumericID( id: unknown ): boolean {
	// `test` converts any value to a string.
	return /^\s*\d+\s*$/.test( id as string );
}
