/**
 * Toggles the More Menu.
 */
export async function toggleMoreMenu() {
	await expect( page ).toClick(
		'.edit-post-more-menu [aria-label="More tools & options"]'
	);
}
