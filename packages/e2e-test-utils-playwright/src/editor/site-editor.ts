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
	await this.page.click(
		'role=region[name="Editor top bar"i] >> role=button[name="Save"i]'
	);
	// Second Save button in the entities panel.
	await this.page.click(
		'role=region[name="Save panel"i] >> role=button[name="Save"i]'
	);
	// A role selector cannot be used here because it needs to check that the `is-busy` class is not present.
	await this.page.waitForSelector( '[aria-label="Saved"].is-busy', {
		state: 'hidden',
	} );
}
