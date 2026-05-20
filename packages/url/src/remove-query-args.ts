/**
 * Internal dependencies
 */
import { getQueryArgs } from './get-query-args';
import { buildQueryString } from './build-query-string';

/**
 * Removes arguments from the query string of the url
 *
 * @param url  URL.
 * @param args Query Args.
 *
 * @example
 * ```js
 * const newUrl = removeQueryArgs( 'https://wordpress.org?foo=bar&bar=baz&baz=foobar', 'foo', 'bar' ); // https://wordpress.org?baz=foobar
 * ```
 *
 * @return Updated URL.
 */
export function removeQueryArgs( url: string, ...args: string[] ): string {
	const fragment = url.replace( /^[^#]*/, '' );
	url = url.replace( /#.*/, '' );

	const queryStringIndex = url.indexOf( '?' );
	if ( queryStringIndex === -1 ) {
		return url + fragment;
	}

	const query = getQueryArgs( url );
	const baseURL = url.substr( 0, queryStringIndex );
	args.forEach( ( arg ) => delete query[ arg ] );
	const queryString = buildQueryString( query );
	const updatedUrl = queryString ? baseURL + '?' + queryString : baseURL;
	return updatedUrl + fragment;
}
