/**
 * External dependencies
 */
import { URL } from 'whatwg-url';

/**
 * Determines whether the given string looks like a URI (of any type).
 * See https://url.spec.whatwg.org/#url-representation for more info.
 *
 * @param {string} uri The string to scrutinise.
 *
 * @example
 * ```js
 * const isURI = isURI( 'https://wordpress.org' ); // true
 * const anotherURI = isURI('mailto:hello@wordpress.org'); // true
 * ```
 *
 * @return {boolean} Whether or not it looks like a URI.
 */
export function isURI( uri ) {
	try {
		new URL( uri );
		return true;
	} catch ( _ ) {
		return false;
	}
}
