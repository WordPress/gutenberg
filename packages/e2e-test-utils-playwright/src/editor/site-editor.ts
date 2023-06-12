/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Save entities in the site editor. Assumes the editor is in a dirty state.
 *
 * @param this
 */
export async function saveSiteEditorEntities( this: Editor ) {
	const editorTopBar = this.page.getByRole( 'region', {
		name: 'Editor top bar',
	} );
	const savePanel = this.page.getByRole( 'region', { name: 'Save panel' } );

	// First Save button in the top bar.
	await editorTopBar
		.getByRole( 'button', { name: 'Save', exact: true } )
		.click();

	// Second Save button in the entities panel.
	await savePanel
		.getByRole( 'button', { name: 'Save', exact: true } )
		.click();

	// A role selector cannot be used here because it needs to check that the `is-busy` class is not present.
	await this.page
		.locator( '[aria-label="Editor top bar"] [aria-label="Saved"].is-busy' )
		.waitFor( {
			state: 'hidden',
		} );
}
