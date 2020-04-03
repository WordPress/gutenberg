/**
 * Determines whether the given string looks like a URL.
 *
 * @param {string} url The string to scrutinise.
 *
 * @example
 * ```js
 * const isURL = isURL( 'https://wordpress.org' ); // true
 * ```
 *
 * @see https://url.spec.whatwg.org/
 * @see https://url.spec.whatwg.org/#valid-url-string
 *
 * @return {boolean} Whether or not it looks like a URL.
 */
export function isURL( url ) {
	// A URL can be considered value if the `URL` constructor is able to parse
	// it. The constructor throws an error for an invalid URL.
	try {
		new URL( url );
		return true;
	} catch ( error ) {
		return false;
	}
}
