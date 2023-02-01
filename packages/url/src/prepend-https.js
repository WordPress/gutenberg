/**
 * Internal dependencies
 */
import { isEmail } from './is-email';

const USABLE_HREF_REGEXP = /^(?:[a-z]+:|#|\?|\.|\/)/i;

/**
 * Prepends "https://" to a url, if it looks like something that is meant to be a TLD.
 *
 * @param {string} url The URL to test.
 *
 * @example
 * ```js
 * const actualURL = prependHTTPS( 'wordpress.org' ); // https://wordpress.org
 * ```
 *
 * @return {string} The updated URL.
 */
export function prependHTTPS( url ) {
	if ( ! url ) {
		return url;
	}

	url = url.trim();
	if ( ! USABLE_HREF_REGEXP.test( url ) && ! isEmail( url ) ) {
		return 'https://' + url;
	}

	return url;
}
