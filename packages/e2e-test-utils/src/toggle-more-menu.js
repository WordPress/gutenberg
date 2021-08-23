/**
 * Toggles the More Menu.
 */
export async function toggleMoreMenu() {
	await expect( page ).toClick(
		'.interface-more-menu-dropdown [aria-label="Options"]'
	);
}
