/**
 * Returns the browser window name that front-end links to a post target, so
 * that each post reuses one tab instead of opening another on every click.
 *
 * `@wordpress/editor` keeps the same helper for the links it owns. Both must
 * return the same name, or a post would open in two tabs.
 *
 * @see https://github.com/WordPress/gutenberg/issues/28479
 *
 * @param postId The ID of the post being viewed.
 *
 * @return The window name to use as a link target.
 */
export function getPostViewWindowName( postId: number | string ): string {
	return `wp-post-${ postId }`;
}
