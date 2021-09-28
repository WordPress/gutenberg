/**
 * Verifies that the edit post sidebar is opened, and if it is not, opens it.
 *
 * @return {Promise} Promise resolving once the edit post sidebar is opened.
 */
export async function ensureSidebarOpened() {
	// This try/catch flow relies on the fact that `page.$eval` throws an error
	// if the element matching the given selector does not exist. Thus, if an
	// error is thrown, it can be inferred that the sidebar is not opened.
	try {
		return page.$eval( '.edit-post-sidebar', () => {} );
	} catch ( error ) {
		return page.click(
			'.edit-post-header__settings [aria-label="Settings"]'
		);
	}
}
