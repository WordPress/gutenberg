/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Publishes the post, resolving once the request is complete (once a notice
 * is displayed).
 *
 * @param {Editor} this
 */
export async function publishPost( this: Editor ) {
	const publishPanelToggle = await this.page.locator(
		'role=button[name="Publish"]'
	);
	const isPublishingPost = await publishPanelToggle.evaluate(
		( element ) => element.textContent === 'Publish'
	);
	const isEntityPublishToggle = await publishPanelToggle.evaluate(
		( element ) => element.classList.contains( 'has-changes-dot' )
	);

	await publishPanelToggle.click();

	// Save any entities.
	if ( isEntityPublishToggle ) {
		// Handle saving entities.
		await this.page.locator( 'role=button[name="Save"]' ).click();
	}

	// If this is just an update then the entity save will be all that's needed.
	// If it's a publish then publish the post in addition to saving the entities.
	if ( isPublishingPost ) {
		// components-button editor-post-publish-button editor-post-publish-button__button is-primary
		// Handle saving just the post.
		const publishToolbar = this.page.locator(
			'role=region[name="Editor publish"]'
		);
		await publishToolbar.locator( 'role=button[name="Publish"]' ).click();

		// A success notice should show up.
		await this.page.waitForSelector(
			'role=button[name=/Dismiss this notice/i] >> text=Post published.'
		);
	}
}
