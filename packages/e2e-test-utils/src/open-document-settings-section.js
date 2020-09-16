/**
 * Internal dependencies
 */
import { openDocumentSettings } from './open-document-settings';

/**
 * Opens the document settings section with the provided title.
 *
 * @param {string} sectionTitle The section name.
 */
export async function openDocumentSettingsSection( sectionTitle ) {
	// Open the document settings modal if it isn't already open.
	await openDocumentSettings();

	const sectionToggle = await page.waitForXPath(
		`//div[contains(@class,"edit-post-post-settings-modal")]//button[@class="components-button components-panel__body-toggle"][contains(text(),"${ sectionTitle }")]`
	);

	const sectionIsCollpased = await sectionToggle.evaluate(
		( node ) => node.getAttribute( 'aria-expanded' ) === 'false'
	);

	if ( sectionIsCollpased ) {
		await sectionToggle.click();
	}
}
