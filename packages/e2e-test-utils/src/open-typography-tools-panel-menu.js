/**
 * Opens the Typography tools panel menu provided via block supports.
 */
export async function openTypographyToolsPanelMenu() {
	const toggleSelector =
		"//div[contains(@class, 'typography-block-support-panel')]//button[contains(@class, 'components-dropdown-menu__toggle')]";
	const toggle = await page.waitForXPath( toggleSelector );
	return toggle.click();
}
