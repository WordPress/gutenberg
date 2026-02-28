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

	if ( ! options.isOnlyCurrentEntityDirty ) {
		// Wait for the entities panel Save button to appear.
		// In slower runtimes (e.g. Playground WASM), the panel region element
		// may exist but stay hidden until the content renders.
		const entitiesPanel = this.page.getByRole( 'region', {
			name: /(Editor publish|Save panel)/,
		} );
		const entitiesSaveButton = entitiesPanel.getByRole( 'button', {
			name: 'Save',
			exact: true,
		} );
		await entitiesSaveButton.waitFor();
		await entitiesSaveButton.click();
	}
	// The text in the notice can be different based on the edited entity, whether
	// we are saving multiple entities and whether we publish or update. So for now,
	// we locate it based on the last part.
	await this.page
		.getByRole( 'button', { name: 'Dismiss this notice' } )
		.getByText( /(updated|published)\./ )
		.first()
		.waitFor();
}
