/**
 * Verifies that the edit post/site/widgets sidebar is opened, and if it is not, opens it.
 *
 * @return {Promise} Promise resolving once the sidebar is opened.
 */
export async function ensureSidebarOpened() {
	const toggleSidebarButton = await page.$(
		'.edit-post-header__settings [aria-label="Settings"][aria-expanded="false"],' +
			'.edit-site-header__actions [aria-label="Settings"][aria-expanded="false"],' +
			'.edit-widgets-header__actions [aria-label="Settings"][aria-expanded="false"],' +
			'.edit-site-header-edit-mode__actions [aria-label="Settings"][aria-expanded="false"],' +
			'.editor-header__settings [aria-label="Settings"][aria-expanded="false"]'
	);

	if ( toggleSidebarButton ) {
		await toggleSidebarButton.click();
	}
}
