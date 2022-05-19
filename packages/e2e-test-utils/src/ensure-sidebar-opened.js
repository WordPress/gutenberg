/**
 * Verifies that the edit post sidebar is opened, and if it is not, opens it.
 *
 * @return {Promise} Promise resolving once the edit post sidebar is opened.
 */
export async function ensureSidebarOpened() {
	const toggleSidebarButton = await page.$(
		'.edit-post-header__settings [aria-label="Settings"][aria-expanded="false"]'
	);

	if ( toggleSidebarButton ) {
		await toggleSidebarButton.click();
	}
}
