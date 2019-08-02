/**
 * Triggers edit mode if not already active.
 *
 * @return {Promise} Promise resolving after enabling the keyboard edit mode.
 */
export async function disableNavigationMode() {
	const focusedElement = await page.$( ':focus' );
	await page.click( '.editor-post-title' );
	if ( focusedElement ) {
		await focusedElement.focus();
	}
}
