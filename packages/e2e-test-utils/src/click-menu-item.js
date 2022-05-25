/**
 * External dependencies
 */
import { first } from 'lodash';

/**
 * Searches for an item in the menu with the text provided and clicks it.
 *
 * @param {string} label The label to search the menu item for.
 */
export async function clickMenuItem( label ) {
	const elementToClick = first(
		await page.$x( `//*[@role="menu"]//*[text()="${ label }"]` )
	);
	await elementToClick.click();
}
