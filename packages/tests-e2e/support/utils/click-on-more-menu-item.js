/**
 * Clicks on More Menu item, searches for the button with the text provided and clicks it.
 *
 * @param {string} buttonLabel The label to search the button for.
 */
export async function clickOnMoreMenuItem( buttonLabel ) {
	await expect( page ).toClick(
		'.edit-post-more-menu [aria-label="Show more tools & options"]'
	);
	await page.click(
		`.edit-post-more-menu__content button[aria-label="${ buttonLabel }"]`
	);
}
