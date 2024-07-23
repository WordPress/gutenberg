/**
 * Internal dependencies
 */
import { getPath, getQueryString } from '.';

/**
 * Returns the path part and query string part of the URL.
 *
 * @param {string} url The full URL.
 *
 * @example
 * ```js
 * const pathAndQueryString1 = getPathAndQueryString( 'http://localhost:8080/this/is/a/test?query=true' ); // '/this/is/a/test?query=true'
 * const pathAndQueryString2 = getPathAndQueryString( 'https://wordpress.org/help/faq/' ); // '/help/faq'
 * ```
 *
 * @return {string} The path part and query string part of the URL.
 */
export function getPathAndQueryString( url ) {
	const path = getPath( url );
	const queryString = getQueryString( url );
	let value = '/';
	if ( path ) {
		value += path;
	}
	if ( queryString ) {
		value += `?${ queryString }`;
	}
	return value;
}
