/**
 * Safely decodes a URI with `decodeURI`. Returns the URI unmodified if
 * `decodeURI` throws an error.
 *
 * @param uri URI to decode.
 *
 * @example
 * ```js
 * const badUri = safeDecodeURI( '%z' ); // does not throw an Error, simply returns '%z'
 * ```
 *
 * @return Decoded URI if possible.
 */
export function safeDecodeURI( uri: string ): string {
	try {
		return decodeURI( uri );
	} catch ( uriError ) {
		return uri;
	}
}
