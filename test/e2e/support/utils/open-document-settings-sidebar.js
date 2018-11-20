/**
 * Clicks on the button in the header which opens Document Settings sidebar when it is closed.
 */
export async function openDocumentSettingsSidebar() {
	const openButton = await page.$(
		'.edit-post-header__settings button[aria-label="Settings"][aria-expanded="false"]'
	);

	if ( openButton ) {
		await openButton.click();
	}
}
