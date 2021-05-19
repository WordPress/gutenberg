/**
 * Opens the publish panel.
 */
export async function openPublishPanel() {
	await page.waitForSelector(
		'.editor-post-publish-panel__toggle:not([aria-disabled="true"])'
	);
	await page.click( '.editor-post-publish-panel__toggle' );
	await page.waitForSelector( '.editor-post-publish-button' );
}
