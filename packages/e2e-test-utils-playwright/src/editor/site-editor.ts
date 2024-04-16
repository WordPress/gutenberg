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
	const savePanel = this.page.getByRole( 'region', { name: 'Save panel' } );

	// First Save button in the top bar.
	await editorTopBar
		.getByRole( 'button', { name: 'Save', exact: true } )
		.click();

	if ( ! options.isOnlyCurrentEntityDirty ) {
		// Second Save button in the entities panel.
		await savePanel
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();
	}
	await this.page
		.getByRole( 'button', { name: 'Dismiss this notice' } )
		.getByText( 'Site updated.' )
		.waitFor();
}
