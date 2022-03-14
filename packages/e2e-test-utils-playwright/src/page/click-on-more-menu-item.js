/**
 * @this {import('./').PageUtils}
 * @typedef {import("./shared/types").GutenbergContext} GutenbergContext
 */

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
	await this.toggleMoreMenu( 'open', context );

	const elementToClick = this.page.locator( `text="${ buttonLabel }"` );

	await elementToClick.click();
}
