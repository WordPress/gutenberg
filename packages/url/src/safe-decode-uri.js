/**
 * Safely decodes a URI with `decodeURI`. Returns the URI unmodified if
 * `decodeURI` throws an error.
 *
 * @param {string} uri URI to decode.
 *
 * @example
 * ```js
 * const badUri = safeDecodeURI( '%z' ); // does not throw an Error, simply returns '%z'
 * ```
 *
 * @return {string} Decoded URI if possible.
 */
export function safeDecodeURI( uri ) {
	try {
		return decodeURI( uri );
	} catch ( uriError ) {
		return uri;
	}
}
