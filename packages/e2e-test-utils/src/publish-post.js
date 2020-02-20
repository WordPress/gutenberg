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

	// Publish the post. The publish post button should be focused so can be
	// submitted using the Enter key.
	await page.keyboard.press( 'Enter' );

	// A success notice should show up
	return page.waitForSelector( '.components-snackbar' );
}
