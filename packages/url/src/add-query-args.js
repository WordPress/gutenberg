/**
 * External dependencies
 */
import { parse, stringify } from 'qs';

/**
 * Appends arguments as querystring to the provided URL. If the URL already
 * includes query arguments, the arguments are merged with (and take precedent
 * over) the existing set.
 *
 * @param {string} [url='']  URL to which arguments should be appended. If omitted,
 *                           only the resulting querystring is returned.
 * @param {Object} args      Query arguments to apply to URL.
 *
 * @example
 * ```js
 * const newURL = addQueryArgs( 'https://google.com', { q: 'test' } ); // https://google.com/?q=test
 * ```
 *
 * @return {string} URL with arguments applied.
 */
export function addQueryArgs( url = '', args ) {
	// If no arguments are to be appended, return original URL.
	if ( ! args || ! Object.keys( args ).length ) {
		return url;
	}

	let baseUrl = url;

	// Determine whether URL already had query arguments.
	const queryStringIndex = url.indexOf( '?' );
	if ( queryStringIndex !== -1 ) {
		// Merge into existing query arguments.
		args = Object.assign(
			parse( url.substr( queryStringIndex + 1 ) ),
			args
		);

		// Change working base URL to omit previous query arguments.
		baseUrl = baseUrl.substr( 0, queryStringIndex );
	}

	return baseUrl + '?' + stringify( args );
}
