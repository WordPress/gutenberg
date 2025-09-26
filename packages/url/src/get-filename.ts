/**
 * Returns the filename part of the URL.
 *
 * @param url The full URL.
 *
 * @example
 * ```js
 * const filename1 = getFilename( 'http://localhost:8080/this/is/a/test.jpg' ); // 'test.jpg'
 * const filename2 = getFilename( '/this/is/a/test.png' ); // 'test.png'
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
	} catch ( error ) {}

	if ( filename ) {
		return filename;
	}
}
