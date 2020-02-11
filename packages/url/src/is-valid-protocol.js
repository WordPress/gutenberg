/**
 * Tests if a url protocol is valid.
 *
 * @param {string} protocol The url protocol.
 *
 * @example
 * ```js
 * const isValid = isValidProtocol( 'https:' ); // true
 * const isNotValid = isValidProtocol( 'https :' ); // false
 * ```
 *
 * @return {boolean} True if the argument is a valid protocol (e.g. http:, tel:).
 */
export function isValidProtocol( protocol ) {
	if ( ! protocol ) {
		return false;
	}
	return /^[a-z\-.\+]+[0-9]*:$/i.test( protocol );
}
