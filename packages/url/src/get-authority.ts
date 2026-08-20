/**
 * Returns the authority part of the URL.
 *
 * @param url The full URL.
 *
 * @example
 * ```js
 * const authority1 = getAuthority( 'https://wordpress.org/help/' ); // 'wordpress.org'
 * const authority2 = getAuthority( 'https://localhost:8080/test/' ); // 'localhost:8080'
 * ```
 *
 * @return The authority part of the URL.
 */
export function getAuthority( url: string ): string | void {
	const matches = /^[^\/\s:]+:(?:\/\/)?\/?([^\/\s#?]+)[\/#?]{0,1}\S*$/.exec(
		url
	);
	if ( matches ) {
		return matches[ 1 ];
	}
}
