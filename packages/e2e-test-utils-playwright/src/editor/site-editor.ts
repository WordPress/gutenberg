/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Save entities in the site editor. Assumes the editor is in a dirty state.
 *
 * @param {Editor} this
 */
export async function saveSiteEditorEntities( this: Editor ) {
	await this.page
		.locator( 'role=region[name="Header"i] >> role=button[name="Save"i]' )
		.click();

	// The sidebar entities panel opens with another save button. Click this too.
	await this.page
		.locator( 'role=region[name="Publish"i] >> role=button[name="Save"i]' )
		.click();

	// The panel will close revealing the main editor save button again.
	// It will have the classname `.is-busy` while saving. Wait for it to
	// not have that classname.
	// TODO - find a way to improve this selector to use role/name.
	await this.page.waitForSelector(
		'.edit-site-save-button__button:not(.is-busy)'
	);
}

/**
 * Toggles the global styles sidebar (opens it if closed and closes it if open).
 *
 * @param {Editor} this
 */
export async function toggleGlobalStyles( this: Editor ) {
	await this.page.click(
		'.edit-site-header__actions button[aria-label="Styles"]'
	);
}

/**
 * Opens a global styles panel.
 *
 * @param {Editor} this
 * @param {string} panelName Name of the panel that is going to be opened.
 */
export async function openGlobalStylesPanel( this: Editor, panelName: string ) {
	const selector = `xpath=//div[@aria-label="Settings"]//button[.//*[text()="${ panelName }"]]`;
	await ( await this.page.locator( selector ) ).click();
}

/**
 * Opens the previous global styles panel.
 *
 * @param {Editor} this
 */
export async function openPreviousGlobalStylesPanel( this: Editor ) {
	await this.page.click(
		'div[aria-label="Settings"] button[aria-label="Navigate to the previous view"]'
	);
}
