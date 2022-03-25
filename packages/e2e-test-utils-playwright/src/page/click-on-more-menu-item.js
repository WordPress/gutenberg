/**
 * Clicks on More Menu item, searches for the button with the text provided and clicks it.
 *
 * @param {string} buttonLabel The label to search the button for.
 */
export async function clickOnMoreMenuItem( buttonLabel ) {
	// await this.toggleMoreMenu( 'open' );

	const menuSelector = await this.page.locator(
		'.interface-more-menu-dropdown [aria-label="Options"]'
	);

	await menuSelector.click();

	const moreMenuContainerSelector =
		'//*[contains(concat(" ", @class, " "), " interface-more-menu-dropdown__content ")]';

	const elementToClick = await this.page
		.locator(
			`${ moreMenuContainerSelector }//span[contains(concat(" ", @class, " "), " components-menu-item__item ")][contains(text(), "${ buttonLabel }")]`
		)
		.first();
	await elementToClick.click();
}
