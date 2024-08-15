/**
 * Clicks on the button in the header which opens Document Settings sidebar when it is closed.
 */
export async function openDocumentSettingsSidebar() {
	const toggleButton = await page.waitForSelector(
		'.edit-post-header__settings button[aria-label="Settings"][aria-disabled="false"]'
	);

	const isClosed = await page.evaluate(
		( element ) => element.getAttribute( 'aria-expanded' ) === 'false',
		toggleButton
	);

	if ( isClosed ) {
		await toggleButton.click();
		await page.waitForSelector( '.editor-sidebar' );
	}
}
