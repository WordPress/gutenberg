/**
 * Returns a promise which resolves with the edited post content (HTML string).
 *
 * @this {import('./').PageUtils}
 * @return {Promise} Promise resolving with post content markup.
 */
export async function getEditedPostContent() {
	return await this.page.evaluate( () =>
		window.wp.data.select( 'core/editor' ).getEditedPostContent()
	);
}
