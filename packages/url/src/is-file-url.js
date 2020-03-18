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
 * @see https://url.spec.whatwg.org/
 * @see https://url.spec.whatwg.org/#valid-url-string
 *
 * @return {boolean} Whether or not it looks like a file URL.
 */
export function isFileURL( url ) {
	return url && url.startsWith( 'file:' );
}
