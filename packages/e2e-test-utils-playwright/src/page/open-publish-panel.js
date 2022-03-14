/**
 * Opens the publish panel.
 *
 * @this {import('./').PageUtils}
 */
export async function openPublishPanel() {
	const publishPanelToggle = await this.page.locator(
		'[aria-disabled="true"].editor-post-publish-panel__toggle'
	);

	const isEntityPublishToggle = await publishPanelToggle.evaluate(
		( element ) => element.classList.contains( 'has-changes-dot' )
	);
	await this.page.click( '.editor-post-publish-panel__toggle' );

	// Wait for either the entity save button or the post publish button.
	if ( isEntityPublishToggle ) {
		await this.page.waitForSelector(
			'.editor-entities-saved-states__save-button'
		);
	} else {
		await this.page.waitForSelector( '.editor-post-publish-button' );
	}
}
