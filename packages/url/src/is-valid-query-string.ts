/**
 * Checks for invalid characters within the provided query string.
 *
 * @param queryString The query string.
 *
 * @example
 * ```js
 * const isValid = isValidQueryString( 'query=true&another=false' ); // true
 * const isNotValid = isValidQueryString( 'query=true?another=false' ); // false
 * ```
 *
 * @return True if the argument contains a valid query string.
 */
export function isValidQueryString( queryString: string ): boolean {
	if ( ! queryString ) {
		return false;
	}
	return /^[^\s#?\/]+$/.test( queryString );
}
