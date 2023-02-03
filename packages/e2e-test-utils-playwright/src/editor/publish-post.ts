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
	const entitiesSaveButton = this.page.locator(
		'role=region[name="Editor publish"i] >> role=button[name="Save"i]'
	);

	const isEntitiesSavePanelVisible = await entitiesSaveButton.isVisible();

	// Save any entities.
	if ( isEntitiesSavePanelVisible ) {
		// Handle saving entities.
		await entitiesSaveButton.click();
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
