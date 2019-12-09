/**
 * Returns the query string part of the URL.
 *
 * @param {string} url The full URL.
 *
 * @example
 * ```js
 * const queryString1 = getQueryString( 'http://localhost:8080/this/is/a/test?query=true#fragment' ); // 'query=true'
 * const queryString2 = getQueryString( 'https://wordpress.org#fragment?query=false&search=hello' ); // 'query=false&search=hello'
 * ```
 *
 * @return {string|void} The query string part of the URL.
 */
export function getQueryString( url ) {
	const matches = /^\S+?\?([^\s#]+)/.exec( url );
	if ( matches ) {
		return matches[ 1 ];
	}
}
