/**
 * Internal dependencies
 */
import type { Editor } from './index';

interface Options {
	// If the only dirty entity is the current one, skip opening the save panel.
	isOnlyCurrentEntityDirty?: boolean;
}

/**
 * Save entities in the site editor. Assumes the editor is in a dirty state.
 *
 * @param this
 * @param options
 */
export async function saveSiteEditorEntities(
	this: Editor,
	options: Options = {}
) {
	const editorTopBar = this.page.getByRole( 'region', {
		name: 'Editor top bar',
	} );
	// Wait for the top bar region to be ready before checking button state.
	await editorTopBar.waitFor();

	// If we have changes in a single entity which can be published the label is `Publish`.
	const saveButton = editorTopBar.getByRole( 'button', {
		name: 'Save',
		exact: true,
	} );
	const publishButton = editorTopBar.getByRole( 'button', {
		name: 'Publish',
	} );
	const saveButtonIsVisible = await saveButton.isVisible();
	// First Save button in the top bar.
	const buttonToClick = saveButtonIsVisible ? saveButton : publishButton;
	await buttonToClick.click();

	// The text in the notice can be different based on the edited entity, whether
	// we are saving multiple entities and whether we publish or update. So for now,
	// we locate it based on the last part.
	const successNotice = this.page
		.getByRole( 'button', { name: 'Dismiss this notice' } )
		.getByText( /(updated|published)\./ )
		.first();

	if ( ! options.isOnlyCurrentEntityDirty ) {
		// Wait for the entities panel Save button to appear.
		// In some runtimes (e.g. Playground WASM), the top-bar Save button
		// may directly save without showing the entities panel, so also
		// watch for the success notice as a fallback.
		const entitiesPanel = this.page.getByRole( 'region', {
			name: /(Editor publish|Save panel)/,
		} );
		const entitiesSaveButton = entitiesPanel.getByRole( 'button', {
			name: 'Save',
			exact: true,
		} );

		// Wait for either the entities Save button or the success notice.
		// Use .first() to avoid strict mode violation when both match.
		await entitiesSaveButton.or( successNotice ).first().waitFor();

		if ( await entitiesSaveButton.isVisible() ) {
			await entitiesSaveButton.click();
		}
	}

	await successNotice.waitFor();
}
