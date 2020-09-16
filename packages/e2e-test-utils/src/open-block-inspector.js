/**
 * Clicks on the button in the header which opens the block inspector sidebar when it is closed.
 */
export async function openBlockInspector() {
	const openButton = await page.$(
		'.edit-post-header__settings button[aria-label="Block inspector"][aria-expanded="false"]'
	);

	if ( openButton ) {
		await openButton.click();
	}
}
