/**
 * Returns the target for a front-end link to a post, so that each post reuses
 * one tab instead of opening another on every click.
 *
 * Only a same-origin link gets a named target. A named target gets no implicit
 * `noopener`, so a cross-origin page could navigate the editor tab through
 * `window.opener`, and plugins can filter a permalink to any URL.
 *
 * @see https://github.com/WordPress/gutenberg/issues/28479
 *
 * @param postId The ID of the post being viewed.
 * @param url    The front-end URL the link points to.
 *
 * @return The window name to reuse, or `_blank`.
 */
export function getPostViewTarget(
	postId: number | string | undefined,
	url: string | undefined
): string {
	if ( postId === undefined || ! url ) {
		return '_blank';
	}

	try {
		const { origin } = new URL( url, document.baseURI );
		if ( origin !== window.location.origin ) {
			return '_blank';
		}
	} catch {
		return '_blank';
	}

	return `wp-post-${ postId }`;
}
