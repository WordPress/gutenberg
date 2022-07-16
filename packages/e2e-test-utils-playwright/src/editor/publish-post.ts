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
	await this.page.click( 'role=button[name="Publish"i]' );
	const publishEditorPanel = this.page.locator(
		'role=region[name="Publish editor"i]'
	);

	const isPublishEditorVisible = await publishEditorPanel.isVisible();

	// Save any entities.
	if ( isPublishEditorVisible ) {
		// Handle saving entities.
		await this.page.click(
			'role=region[name="Editor publish"i] >> role=button[name="Save"i]'
		);
	}

	// Handle saving just the post.
	await this.page.click(
		'role=region[name="Editor publish"i] >> role=button[name="Publish"i]'
	);

	const urlString = await this.page.inputValue(
		'role=textbox[name="Post address"i]'
	);
	const url = new URL( urlString );
	const postId = url.searchParams.get( 'p' );

	return typeof postId === 'string' ? parseInt( postId, 10 ) : null;
}
