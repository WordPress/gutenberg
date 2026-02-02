/**
 * Internal dependencies
 */
import { prependHTTPS } from './prepend-https';

/**
 * Prepends "http://" to a url, if it looks like something that is meant to be a TLD.
 *
 * @param url The URL to test.
 *
 * @example
 * ```js
 * const actualURL = prependHTTP( 'wordpress.org' ); // http://wordpress.org
 * ```
 *
 * @return The updated URL.
 */
export function prependHTTP( url: string ): string {
	if ( ! url ) {
		return url;
	}

	// If url starts with http://, return it as is.
	if ( url.startsWith( 'http://' ) ) {
		return url;
	}

	url = prependHTTPS( url );

	return url.replace( /^https:/, 'http:' );
}
