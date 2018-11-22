/**
 * Publishes the post without the pre-publish checks,
 * resolving once the request is complete (once a notice is displayed).
 *
 * @return {Promise} Promise resolving when publish is complete.
 */
export async function publishPostWithoutPrePublishChecks() {
	await page.click( '.editor-post-publish-button' );
	return page.waitForSelector( '.components-notice.is-success' );
}
