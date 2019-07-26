/**
 * Move the mouse to trigger Edit Mode
 *
 * @return {Promise} Promise resolving after enabling the keyboard edit mode.
 */
export async function switchToEditMode() {
	const focusedElement = await page.$( ':focus' );
	await page.click( '.editor-post-title' );
	if ( focusedElement ) {
		await focusedElement.focus();
	}
}
