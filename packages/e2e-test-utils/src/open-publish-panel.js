/**
 * Opens the publish panel.
 */
export async function openPublishPanel() {
	const publishPanelToggle = await page.waitForSelector(
		'.editor-post-publish-panel__toggle:not([aria-disabled="true"])'
	);
	const isEntityPublishToggle = await publishPanelToggle.evaluate(
		( element ) => element.classList.contains( 'has-changes-dot' )
	);
	await page.click( '.editor-post-publish-panel__toggle' );

	// Wait for either the entity save button or the post publish button.
	if ( isEntityPublishToggle ) {
		await page.waitForSelector(
			'.editor-entities-saved-states__save-button'
		);
	} else {
		await page.waitForSelector( '.editor-post-publish-button' );
	}
}
