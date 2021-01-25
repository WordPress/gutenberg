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
	// it. The constructor throws an error for most invalid URLs.
	try {
		const parsed = new URL( url );

		// Special cases
		if ( /^\s/.test( parsed.pathname ) ) {
			// Valid paths probably don't start with whitespace
			return false;
		}

		// Check given protocol (parsed is lowercase)
		const m = url.match( /^\s*([^:]+):/ );
		if ( ! m ) {
			// No protocol
			return false;
		}

		if ( /[A-Z]/.test( m[ 1 ] ) && /[a-z]/.test( m[ 1 ] ) ) {
			// Mixed case protocol could be a word like "Note:" but let
			// it pass if it's a recognized protocol.
			return /^(https?|s?ftp|ssh|mailto)?:$/.test( parsed.protocol );
		}

		return true;
	} catch ( error ) {
		return false;
	}
}
