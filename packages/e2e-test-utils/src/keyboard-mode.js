/**
 * Move the mouse to trigger Edit Mode
 *
 * @return {Promise} Promise resolving after enabling the keyboard edit mode.
 */
export async function switchToEditMode() {
	await page.mouse.move( 0, 0 );
	await page.mouse.move( 10, 10 );
}
