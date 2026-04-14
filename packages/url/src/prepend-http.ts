/**
 * Internal dependencies
 */
import { isEmail } from './is-email';

const USABLE_HREF_REGEXP = /^(?:[a-z]+:|#|\?|\.|\/)/i;

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

	url = url.trim();
	if ( ! USABLE_HREF_REGEXP.test( url ) && ! isEmail( url ) ) {
		return 'http://' + url;
	}

	return url;
}
