/**
 * Returns a promise which resolves with the edited post content (HTML string).
 *
 * @this {import('./').PageUtils}
 *
 * @return {Promise} Promise resolving with post content markup.
 */
export async function getEditedPostContent() {
	return this.wpDataSelect( 'core/editor', 'getEditedPostContent' );
}
