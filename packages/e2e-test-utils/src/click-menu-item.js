/**
 * Searches for an item in the menu with the text provided and clicks it.
 *
 * @param {string} label The label to search the menu item for.
 */
export async function clickMenuItem( label ) {
	const menuItem = await page.waitForXPath(
		`//*[@role="menu"]//*[text()="${ label }"]`
	);
	await menuItem.click();
}
