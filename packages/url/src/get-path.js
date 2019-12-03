/**
 * Returns the path part of the URL.
 *
 * @param {string} url The full URL.
 *
 * @example
 * ```js
 * const path1 = getPath( 'http://localhost:8080/this/is/a/test?query=true' ); // 'this/is/a/test'
 * const path2 = getPath( 'https://wordpress.org/help/faq/' ); // 'help/faq'
 * ```
 *
 * @return {string|void} The path part of the URL.
 */
export function getPath( url ) {
	const matches = /^[^\/\s:]+:(?:\/\/)?[^\/\s#?]+[\/]([^\s#?]+)[#?]{0,1}\S*$/.exec( url );
	if ( matches ) {
		return matches[ 1 ];
	}
}
