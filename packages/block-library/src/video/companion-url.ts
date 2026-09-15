/**
 * Builds the URL of a companion file stored next to an attachment's original.
 *
 * Companion files are sideloaded into the attachment's own directory and
 * recorded in its metadata by basename only, so their URLs are derived from
 * the attachment's source URL.
 *
 * @param sourceUrl Attachment source URL.
 * @param basename  Companion file basename.
 *
 * @return Absolute companion URL.
 */
export function companionUrl( sourceUrl: string, basename: string ): string {
	return sourceUrl.slice( 0, sourceUrl.lastIndexOf( '/' ) + 1 ) + basename;
}
