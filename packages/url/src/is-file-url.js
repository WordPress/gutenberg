/**
 * Determines whether the given string looks like a file URL.
 *
 * @param {string} url The string to scrutinise.
 *
 * @example
 * ```js
 * const isFileURL = isFileURL( 'file:///file.txt' ); // true
 * ```
 *
 * @return {boolean} Whether or not it looks like a file URL.
 */
export function isFileURL( url ) {
	return url !== undefined && url.startsWith( 'file:' );
}
