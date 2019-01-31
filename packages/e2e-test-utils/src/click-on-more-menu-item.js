/**
 * External dependencies
 */
import { first } from 'lodash';

/**
 * Clicks on More Menu item, searches for the button with the text provided and clicks it.
 *
 * @param {string} buttonLabel The label to search the button for.
 */
export async function clickOnMoreMenuItem( buttonLabel ) {
	await expect( page ).toClick(
		'.edit-post-more-menu [aria-label="Show more tools & options"]'
	);
	const moreMenuContainerSelector =
		'//*[contains(concat(" ", @class, " "), " edit-post-more-menu__content ")]';
	let elementToClick = first( await page.$x(
		`${ moreMenuContainerSelector }//button[contains(text(), "${ buttonLabel }")]`
	) );
	// If button is not found, the label should be on the info wrapper.
	if ( ! elementToClick ) {
		elementToClick = first( await page.$x(
			moreMenuContainerSelector +
			'//button' +
			`/*[contains(concat(" ", @class, " "), " components-menu-item__info-wrapper ")][contains(text(), "${ buttonLabel }")]`
		) );
	}
	await elementToClick.click();
}
