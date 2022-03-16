/**
 * External dependencies
 */
import { first } from 'lodash';

/**
 * Internal dependencies
 */
import { toggleMoreMenu } from './toggle-more-menu';

/**
 * Clicks on More Menu item, searches for the button with the text provided and clicks it.
 *
 * @param {string} buttonLabel The label to search the button for.
 */
export async function clickOnMoreMenuItem( buttonLabel ) {
	await toggleMoreMenu( 'open' );
	const moreMenuContainerSelector =
		'//*[contains(concat(" ", @class, " "), " interface-more-menu-dropdown__content ")]';

	const elementToClick = first(
		await page.$x(
			`${ moreMenuContainerSelector }//span[contains(concat(" ", @class, " "), " components-menu-item__item ")][contains(text(), "${ buttonLabel }")]`
		)
	);
	await elementToClick.click();
}
