/**
 * Opens the Color tools panel menu provided via block supports.
 */
export async function openColorToolsPanelMenu() {
	const toggleSelector =
		"//div[contains(@class, 'color-block-support-panel')]//button[contains(@class, 'components-dropdown-menu__toggle')]";
	const toggle = await page.waitForXPath( toggleSelector );
	return toggle.click();
}
