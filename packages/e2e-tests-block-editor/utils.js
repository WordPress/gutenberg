/**
 * Returns a promise which resolves with the edited post content (HTML string).
 *
 * @return {Promise} Promise resolving with post content markup.
 */
export async function getEditedPostContent() {
	return page.evaluate( () => window._getContent() );
}
