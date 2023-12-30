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

	await this.page
		.getByRole( 'button', { name: 'Dismiss this notice' } )
		.getByText( 'Site updated.' )
		.waitFor();
}
