/**
 * Move the mouse to trigger Edit Mode
 *
 * @return {Promise} Promise resolving after enabling the keyboard edit mode.
 */
export async function switchToEditMode() {
	await page.click( '.edit-post-layout__content' );
}
