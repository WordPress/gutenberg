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

	return filteredURL;
}
