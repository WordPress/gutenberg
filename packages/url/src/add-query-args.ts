/**
 * Internal dependencies
 */
import { getQueryArgs } from './get-query-args';
import { buildQueryString } from './build-query-string';
import { getFragment } from './get-fragment';

/**
 * Appends arguments as querystring to the provided URL. If the URL already
 * includes query arguments, the arguments are merged with (and take precedent
 * over) the existing set.
 *
 * @param url  URL to which arguments should be appended. If omitted,
 *             only the resulting querystring is returned.
 * @param args Query arguments to apply to URL.
 *
 * @example
 * ```js
 * const newURL = addQueryArgs( 'https://google.com', { q: 'test' } ); // https://google.com/?q=test
 * ```
 *
 * @return URL with arguments applied.
 */
export function addQueryArgs(
	url: string = '',
	args?: Record< string, unknown >
): string {
	// If no arguments are to be appended, return original URL.
	if ( ! args || ! Object.keys( args ).length ) {
		return url;
	}

	const fragment = getFragment( url ) || '';
	let baseUrl = url.replace( fragment, '' );

	// Determine whether URL already had query arguments.
	const queryStringIndex = url.indexOf( '?' );
	if ( queryStringIndex !== -1 ) {
		// Merge into existing query arguments.
		args = Object.assign( getQueryArgs( url ), args );

		// Change working base URL to omit previous query arguments.
		baseUrl = baseUrl.substr( 0, queryStringIndex );
	}

	return baseUrl + '?' + buildQueryString( args ) + fragment;
}
