/**
 * Checks for invalid characters within the provided fragment.
 *
 * @param fragment The url fragment.
 *
 * @example
 * ```js
 * const isValid = isValidFragment( '#valid-fragment' ); // true
 * const isNotValid = isValidFragment( '#invalid-#fragment' ); // false
 * ```
 *
 * @return True if the argument contains a valid fragment.
 */
export function isValidFragment( fragment: string ): boolean {
	if ( ! fragment ) {
		return false;
	}
	return /^#[^\s#?\/]*$/.test( fragment );
}
