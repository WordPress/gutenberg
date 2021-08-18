/**
 * Searches for an item in the menu with the text provided and clicks it.
 *
 * @param {string} label The label to search the menu item for.
 */
export async function clickMenuItem( label ) {
	await page.click( `button :text("${ label }")` );
}
