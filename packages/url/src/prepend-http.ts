import { isEmail } from './is-email';

/*
 * Matches a URL that already starts with a scheme, `#`, `?`, `.` or `/`.
 * A scheme of letters alone needs only a colon, so `mailto:` and `tel:` match.
 * A scheme that also contains digits, `+` or `-` must be followed by `//`,
 * so `chrome-extension://` matches but a bare host and port such as
 * `my-site:8080` does not.
 */
const USABLE_HREF_REGEXP = /^(?:[a-z]+:|[a-z][a-z0-9+-]*:\/\/|#|\?|\.|\/)/i;

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
