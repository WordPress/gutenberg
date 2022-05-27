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
		'role=button[name="Publish"i]'
	);
	// The classname is the only indicator that entities await publishing.
	const isEntityPublishToggle = await publishPanelToggle.evaluate(
		( element ) => element.classList.contains( 'has-changes-dot' )
	);

	await publishPanelToggle.click();

	// Save any entities.
	if ( isEntityPublishToggle ) {
		// Handle saving entities.
		await this.page.click(
			'role=region[name="Editor publish"i] >> role=button[name="Save"i]'
		);
	}

	// components-button editor-post-publish-button editor-post-publish-button__button is-primary
	// Handle saving just the post.
	await this.page.click(
		'role=region[name="Editor publish"i] >> role=button[name="Publish"i]'
	);
}
