/**
 * Returns the protocol part of the URL.
 *
 * @param url The full URL.
 *
 * @example
 * ```js
 * const protocol1 = getProtocol( 'tel:012345678' ); // 'tel:'
 * const protocol2 = getProtocol( 'https://wordpress.org' ); // 'https:'
 * ```
 *
 * @return  The protocol part of the URL.
 */
export function getProtocol( url: string ): string | void {
	const matches = /^([^\s:]+:)/.exec( url );
	if ( matches ) {
		return matches[ 1 ];
	}
}
