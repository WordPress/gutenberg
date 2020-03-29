/**
 * Returns a URL for display.
 *
 * @param {string} url Original URL.
 *
 * @example
 * ```js
 * const displayUrl = filterURLForDisplay( 'https://www.wordpress.org/gutenberg/' ); // wordpress.org/gutenberg
 * ```
 *
 * @return {string} Displayed URL.
 */
export function filterURLForDisplay( url ) {
	// Remove protocol and www prefixes.
	const filteredURL = url.replace( /^(?:https?:)\/\/(?:www\.)?/, '' );

	// Ends with / and only has that single slash, strip it.
	if ( filteredURL.match( /^[^\/]+\/$/ ) ) {
		return filteredURL.replace( '/', '' );
	}

	// Prettify image urls
	const mediaRegexp = /([\w|:])*\.(?:jpg|jpeg|gif|png|svg)/g;
	const colon = ':';
	const period = '.';
	const query = '?';
	if ( filteredURL.match( mediaRegexp ) ) {
		let tokens = filteredURL.split( '/' );
		let imageToken = tokens[ tokens.length - 1 ];
		if ( imageToken.includes( query ) ) {
			imageToken = imageToken.split( query )[ 0 ];
		}
		if ( tokens[ 0 ].includes( colon ) ) {
			tokens = tokens[ 0 ].split( colon );
		}
		if ( tokens[ 0 ].includes( period ) ) {
			tokens = tokens[ 0 ].split( period );
		}
		const prettifiedImageURL = tokens[ 0 ] + '...' + imageToken;
		return prettifiedImageURL;
	}

	return filteredURL;
}
