/**
 * Internal dependencies
 */
import { openPublishPanel } from './open-publish-panel';

/**
 * Publishes the post, resolving once the request is complete (once a notice
 * is displayed).
 *
 * @return {Promise} Promise resolving when publish is complete.
 */
export async function publishPost() {
	await openPublishPanel();

	// Publish the post
	await page.click( '.editor-post-publish-button' );

	// A success notice should show up
	return page.waitForXPath(
		'//div[contains(@class, "components-snackbar__content") and contains(text(),"Post published.")]'
	);
}
