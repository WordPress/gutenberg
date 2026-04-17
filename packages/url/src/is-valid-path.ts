/**
 * Checks for invalid characters within the provided path.
 *
 * @param path The URL path.
 *
 * @example
 * ```js
 * const isValid = isValidPath( 'test/path/' ); // true
 * const isNotValid = isValidPath( '/invalid?test/path/' ); // false
 * ```
 *
 * @return True if the argument contains a valid path
 */
export function isValidPath( path: string ): boolean {
	if ( ! path ) {
		return false;
	}
	return /^[^\s#?]+$/.test( path );
}
