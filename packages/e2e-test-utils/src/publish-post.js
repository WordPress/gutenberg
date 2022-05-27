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
	const publishPanelToggle = await page.$(
		'.editor-post-publish-panel__toggle'
	);
	const isPublishingPost = await publishPanelToggle.evaluate(
		( element ) => element.textContent === 'Publish'
	);
	const isEntityPublishToggle = await publishPanelToggle.evaluate(
		( element ) => element.classList.contains( 'has-changes-dot' )
	);

	await openPublishPanel();

	// Save any entities.
	if ( isEntityPublishToggle ) {
		// Handle saving entities.
		await page.click( '.editor-entities-saved-states__save-button' );
	}

	// If this is just an update then the entity save will be all that's needed.
	// If it's a publish then publish the post in addition to saving the entities.
	if ( isPublishingPost ) {
		// components-button editor-post-publish-button editor-post-publish-button__button is-primary
		// Handle saving just the post.
		const publishButton = await page.waitForSelector(
			'.editor-post-publish-button:not([aria-disabled="true"])'
		);
		await publishButton.click();

		// A success notice should show up.
		return page.waitForSelector( '.components-snackbar' );
	}
}
