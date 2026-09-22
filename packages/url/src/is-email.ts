const EMAIL_REGEXP =
	/^(mailto:)?[a-z0-9._%+-]+@[a-z0-9][a-z0-9.-]*\.[a-z]{2,63}$/i;

/**
 * Determines whether the given string looks like an email.
 *
 * @param email The string to scrutinise.
 *
 * @example
 * ```js
 * const isEmail = isEmail( 'hello@wordpress.org' ); // true
 * ```
 *
 * @return Whether or not it looks like an email.
 */
export function isEmail( email: string ): boolean {
	return EMAIL_REGEXP.test( email );
}
