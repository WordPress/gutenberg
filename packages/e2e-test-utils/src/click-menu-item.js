/**
 * Searches for an item in the menu with the text provided and clicks it.
 *
 * @param {string} label The label to search the menu item for.
 */
export async function clickMenuItem( label ) {
	const menuItems = await page.$x(
		`//*[@role="menu"]//*[text()="${ label }"]`
	);
	await menuItems[ 0 ].click();
}
