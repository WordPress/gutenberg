/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Publishes the post, resolving once the request is complete (once a notice
 * is displayed).
 *
 * @param this
 */
export async function publishPost( this: Editor ) {
	// If we have changes in other entities, the label is `Save` instead of `Publish`.
	const saveButton = this.page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Save', exact: true } );
	const publishButton = this.page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Publish', exact: true } );
	const buttonToClick = ( await saveButton.isVisible() )
		? saveButton
		: publishButton;
	await buttonToClick.click();

	const entitiesSaveButton = this.page
		.getByRole( 'region', { name: 'Editor publish' } )
		.getByRole( 'button', { name: 'Save', exact: true } );
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

	await this.page
		.getByRole( 'button', { name: 'Dismiss this notice' } )
		.filter( { hasText: 'published' } )
		.waitFor();
	const postId = new URL( this.page.url() ).searchParams.get( 'post' );

	return typeof postId === 'string' ? parseInt( postId, 10 ) : null;
}
