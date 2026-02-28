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

	const publishConfirmButton = publishRegion.getByRole( 'button', {
		name: 'Publish',
		exact: true,
	} );

	// In some runtimes (e.g. Playground WASM), the publish panel may not
	// appear at all — the post is saved directly. Watch for either the
	// panel content or the success notice.
	const successNotice = this.page
		.getByRole( 'button', { name: 'Dismiss this notice' } )
		.filter( { hasText: 'published' } );

	await entitiesSaveButton
		.or( publishConfirmButton )
		.or( successNotice )
		.first()
		.waitFor();

	// Save any entities if the entities panel appeared.
	if ( await entitiesSaveButton.isVisible() ) {
		await entitiesSaveButton.click();
	}

	// Click the publish confirmation button if the publish panel appeared.
	if ( await publishConfirmButton.isVisible() ) {
		await publishConfirmButton.click();
	}

	await successNotice.waitFor();
	const postId = new URL( this.page.url() ).searchParams.get( 'post' );

	return typeof postId === 'string' ? parseInt( postId, 10 ) : null;
}
