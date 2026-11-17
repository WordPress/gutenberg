import { safeDecodeURIComponent } from './safe-decode-uri-component';

/**
 * Returns the filename part of the URL, decoded so that percent-encoded
 * characters read as they would in a file manager. A filename that can't be
 * decoded is returned as it appears in the URL.
 *
 * @param url The full URL.
 *
 * @example
 * ```js
 * const filename1 = getFilename( 'http://localhost:8080/this/is/a/test.jpg' ); // 'test.jpg'
 * const filename2 = getFilename( '/this/is/a/test.png' ); // 'test.png'
 * const filename3 = getFilename( '/uploads/%E9%9F%B3.mp3' ); // '音.mp3'
 * ```
 *
 * @return The filename part of the URL.
 */
export function getFilename( url: string ): string | void {
	let filename;

	if ( ! url ) {
		return;
	}

	try {
		filename = new URL( url, 'http://example.com' ).pathname
			.split( '/' )
			.pop();
	} catch {}

	if ( filename ) {
		// Decode after splitting the path, so an encoded slash (`%2F`) stays
		// part of the filename instead of being treated as a separator.
		return safeDecodeURIComponent( filename );
	}
}
