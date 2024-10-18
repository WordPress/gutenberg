/**
 * Trims a long URL to a more concise format for display.
 *
 * This function intelligently handles long URLs by removing unnecessary parts such as protocol, www prefix,
 * query string, fragment, index.html, and trailing slash. If the URL is longer than 40 characters,
 * it shortens it by showing relevant parts of the URL.
 *
 * @param {string} url - The URL to be trimmed.
 *
 * @return {string} The trimmed URL.
 */
export default function trimLongURL( url ) {
	let trimmedURL = url;

	// Decode URL
	trimmedURL = decodeURIComponent( trimmedURL );

	// Remove protocol and www prefix
	trimmedURL = trimmedURL.replace( /^(?:https?:)?\/\/(?:www\.)?/, '' );

	// Remove query string
	const queryStringIndex = trimmedURL.indexOf( '?' );
	if ( queryStringIndex !== -1 ) {
		trimmedURL = trimmedURL.slice( 0, queryStringIndex );
	}

	// Remove fragment
	const fragmentIndex = trimmedURL.indexOf( '#' );
	if ( fragmentIndex !== -1 ) {
		trimmedURL = trimmedURL.slice( 0, fragmentIndex );
	}

	// Remove index.html
	trimmedURL = trimmedURL.replace( /(?:index)?\.html$/, '' );

	// Remove trailing slash
	if ( trimmedURL.charAt( trimmedURL.length - 1 ) === '/' ) {
		trimmedURL = trimmedURL.slice( 0, -1 );
	}

	// Shorten URL if longer than 40 characters
	if ( trimmedURL.length > 40 ) {
		const firstSlashIndex = trimmedURL.indexOf( '/' );
		const lastSlashIndex = trimmedURL.lastIndexOf( '/' );
		if (
			firstSlashIndex !== -1 &&
			lastSlashIndex !== -1 &&
			lastSlashIndex !== firstSlashIndex
		) {
			// If beginning + ending are shorter than 40 chars, show more of the ending
			if ( firstSlashIndex + trimmedURL.length - lastSlashIndex < 40 ) {
				trimmedURL =
					trimmedURL.slice( 0, firstSlashIndex + 1 ) +
					'\u2026' +
					trimmedURL.slice( -( 40 - ( firstSlashIndex + 1 ) ) );
			} else {
				trimmedURL =
					trimmedURL.slice( 0, firstSlashIndex + 1 ) +
					'\u2026' +
					trimmedURL.slice( lastSlashIndex );
			}
		}
	}

	return trimmedURL;
}
