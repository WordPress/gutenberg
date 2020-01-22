/**
 * External dependencies
 */
import { isUri } from 'valid-url';

/**
 * Determines whether the given string looks like a URI (of any type).
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
	return isUri( uri );
}
