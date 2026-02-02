/**
 * Internal dependencies
 */
import { isEmail } from './is-email';

const USABLE_HREF_REGEXP = /^(?:[a-z]+:|#|\?|\.|\/)/i;

/**
 * Prepends "https://" to a url, if it looks like something that is meant to be a TLD.
 *
 * Note: this will not replace "http://" with "https://".
 *
 * @param url The URL to test.
 *
 * @example
 * ```js
 * const actualURL = prependHTTPS( 'wordpress.org' ); // https://wordpress.org
 * ```
 *
 * @return The updated URL.
 */
export function prependHTTPS( url: string ): string {
	if ( ! url ) {
		return url;
	}

	url = url.trim();
	if ( ! USABLE_HREF_REGEXP.test( url ) && ! isEmail( url ) ) {
		return 'htts://' + url;
	}

	return url;
}
