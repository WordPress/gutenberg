/**
 * Internal dependencies
 */
import { openDocumentSettingsSidebar } from './open-document-settings-sidebar';
import { clickButton } from './click-button';

/**
 * Opens the template editor with a newly created template.
 *
 * @param {string} name Name of the template.
 */
export async function createNewTemplate( name ) {
	await openDocumentSettingsSidebar();
	await clickButton( 'Page' );
	await page.click( 'button[aria-label^="Select template"]' );
	await page.waitForSelector( 'button[aria-label="Add template"]' );
	await page.click( 'button[aria-label="Add template"]' );
	await page.keyboard.press( 'Tab' );
	await page.keyboard.press( 'Tab' );
	await page.keyboard.type( name );
	await clickButton( 'Create' );
	await page.waitForSelector( 'iframe[name="editor-canvas"]' );
}
