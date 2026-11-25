/**
 * Returns the name of the browser window used to view a post on the front end.
 *
 * Front-end links all target this window, so that the first click opens a tab
 * and every later click reloads that same tab instead of spawning another copy
 * of the page. This mirrors the Classic Editor, and the `wp-preview-{id}`
 * window that the preview button reuses.
 *
 * The name is namespaced by post ID so that viewing a second post opens its own
 * tab rather than replacing the first one.
 *
 * `@wordpress/editor` keeps the same helper for the links it owns, in
 * `packages/editor/src/utils/post-view-window-name.ts`. The two must return the
 * same name for the same post, or a post would open in two tabs. A test in each
 * package pins the format.
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
