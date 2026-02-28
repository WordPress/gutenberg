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
	const editorTopBar = this.page.getByRole( 'region', {
		name: 'Editor top bar',
	} );
	// Wait for the top bar to render before checking button visibility.
	await editorTopBar.waitFor();

	// If we have changes in other entities, the label is `Save` instead of `Publish`.
	const saveButton = editorTopBar.getByRole( 'button', {
		name: 'Save',
		exact: true,
	} );
	const publishButton = editorTopBar.getByRole( 'button', {
		name: 'Publish',
		exact: true,
	} );
	const buttonToClick = ( await saveButton.isVisible() )
		? saveButton
		: publishButton;
	await buttonToClick.click();

	const publishRegion = this.page.getByRole( 'region', {
		name: 'Editor publish',
	} );

	const entitiesSaveButton = publishRegion.getByRole( 'button', {
		name: 'Save',
		exact: true,
	} );

	// In slower runtimes (e.g. Playground WASM), the publish panel may not
	// appear immediately after clicking the top-bar button. Wait for the
	// first actionable element inside the panel (either entities Save or
	// the Publish confirmation button).
	const publishConfirmButton = publishRegion.getByRole( 'button', {
		name: 'Publish',
		exact: true,
	} );
	await entitiesSaveButton.or( publishConfirmButton ).waitFor();

	const isEntitiesSavePanelVisible = await entitiesSaveButton.isVisible();

	// Save any entities.
	if ( isEntitiesSavePanelVisible ) {
		// Handle saving entities.
		await entitiesSaveButton.click();
	}

	// Handle saving just the post.
	await publishConfirmButton.click();

	await this.page
		.getByRole( 'button', { name: 'Dismiss this notice' } )
		.filter( { hasText: 'published' } )
		.waitFor();
	const postId = new URL( this.page.url() ).searchParams.get( 'post' );

	return typeof postId === 'string' ? parseInt( postId, 10 ) : null;
}
