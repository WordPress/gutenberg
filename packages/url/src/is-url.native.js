const URL_REGEXP = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)(?::\d{2,5})?((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/i;

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
 * @return {boolean} Whether or not it looks like a URL.
 */
export function isURL( url ) {
	const match = url.match( URL_REGEXP );
	// The current REGEX pattern will match strings where a valid url is part of it,
	// so things like 'this is https://wordpress.com' will return true using `URL_REGEXP.test( url );`.
	// This check will ensure that the matched url (the url found) is the same as the original string,
	// so the given example will return false.
	return match !== null && match.length >= 1 && match[ 0 ] === url;
}
