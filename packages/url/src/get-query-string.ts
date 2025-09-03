/**
 * Returns the query string part of the URL.
 *
 * @param url The full URL.
 *
 * @example
 * ```js
 * const queryString = getQueryString( 'http://localhost:8080/this/is/a/test?query=true#fragment' ); // 'query=true'
 * ```
 *
 * @return The query string part of the URL.
 */
export function getQueryString( url: string ): string | void {
	let query;
	try {
		query = new URL( url, 'http://example.com' ).search.substring( 1 );
	} catch ( error ) {}

	if ( query ) {
		return query;
	}
}
