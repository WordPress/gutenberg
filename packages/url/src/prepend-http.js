/**
 * Internal dependencies
 */
import { isEmail } from './is-email';

const USABLE_HREF_REGEXP = /^(?:[a-z]+:|#|\?|\.|\/)/i;

/**
 * Prepends "http://" to a url, if it looks like something that is meant to be a TLD.
 *
 * @param {string}  url   The URL to test.
 *
 * @param {boolean} https whether or not to use secure https protocol.
 * @example
 * ```js
 * const actualURL = prependHTTP( 'wordpress.org' ); // http://wordpress.org
 * ```
 *
 * @return {string} The updated URL.
 */
export function prependHTTP( url, https = false ) {
	if ( ! url ) {
		return url;
	}

	url = url.trim();
	if ( ! USABLE_HREF_REGEXP.test( url ) && ! isEmail( url ) ) {
		const protocol = https ? 'https://' : 'http://';
		return `${ protocol }${ url }`;
	}

	return url;
}
