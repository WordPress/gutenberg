/**
 * Internal dependencies
 */
import { getQueryArgs } from './get-query-args';
import { buildQueryString } from './build-query-string';

/**
 * Removes arguments from the query string of the url
 *
 * @param {string}    url  URL.
 * @param {...string} args Query Args.
 *
 * @example
 * ```js
 * const newUrl = removeQueryArgs( 'https://wordpress.org?foo=bar&bar=baz&baz=foobar', 'foo', 'bar' ); // https://wordpress.org?baz=foobar
 * ```
 *
 * @return {string} Updated URL.
 */
export function removeQueryArgs( url, ...args ) {
	const queryStringIndex = url.indexOf( '?' );
	if ( queryStringIndex === -1 ) {
		return url;
	}

	const query = getQueryArgs( url );
	const baseURL = url.substr( 0, queryStringIndex );
	args.forEach( ( arg ) => delete query[ arg ] );
	const queryString = buildQueryString( query );
	return queryString ? baseURL + '?' + queryString : baseURL;
}
