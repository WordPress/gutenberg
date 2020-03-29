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
	if ( filteredURL.match( mediaRegexp ) ) {
		const tokens = filteredURL.split( '/' );
		const prettifiedImageURL =
			tokens[ 0 ] + '...' + tokens[ tokens.length - 1 ];
		return prettifiedImageURL;
	}

	return filteredURL;
}
