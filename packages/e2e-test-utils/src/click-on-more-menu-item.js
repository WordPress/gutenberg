/**
 * External dependencies
 */
import { first } from 'lodash';

/**
 * Internal dependencies
 */
import { toggleMoreMenu } from './toggle-more-menu';

/**
 * @typedef {import("./shared/types").GutenbergContext} GutenbergContext
 */

const SELECTORS = {
	postEditorMenuContainer:
		'//*[contains(concat(" ", @class, " "), " edit-post-more-menu__content ")]',
	siteEditorMenuContainer:
		'//*[contains(concat(" ", @class, " "), " edit-site-more-menu__content ")]',
};

/**
 * Clicks on More Menu item, searches for the button with the text provided and clicks it.
 *
 * @param {string}           buttonLabel             The label to search the button for.
 * @param {GutenbergContext} [context='post-editor'] Whether to click the button in the post editor or site editor context.
 */
export async function clickOnMoreMenuItem(
	buttonLabel,
	context = 'post-editor'
) {
	await toggleMoreMenu();
	const moreMenuContainerSelector =
		context === 'post-editor'
			? SELECTORS.postEditorMenuContainer
			: SELECTORS.siteEditorMenuContainer;

	const elementToClick = first(
		await page.$x(
			`${ moreMenuContainerSelector }//span[contains(concat(" ", @class, " "), " components-menu-item__item ")][contains(text(), "${ buttonLabel }")]`
		)
	);
	await elementToClick.click();
}
