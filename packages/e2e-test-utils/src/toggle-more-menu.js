/**
 * @typedef {import("./shared/types").GutenbergContext} GutenbergContext
 */

const SELECTORS = {
	postEditorMenuContent: '.interface-more-menu-dropdown__content',
	siteEditorMenuContent: '.edit-site-more-menu__content',
	postEditorMenu: '.edit-post-more-menu [aria-label="Options"]',
	siteEditorMenu: '.edit-site-more-menu [aria-label="More tools & options"]',
};

/**
 * Toggles the More Menu.
 *
 * @param {'open' | 'close'} [waitFor]               Whether it should wait for the menu to open or close. If `undefined` it won't wait for anything.
 * @param {GutenbergContext} [context='post-editor'] Whether it's toggling in the context of the site editor or post editor.
 */
export async function toggleMoreMenu( waitFor, context = 'post-editor' ) {
	const menuSelector =
		context === 'post-editor'
			? SELECTORS.postEditorMenu
			: SELECTORS.siteEditorMenu;

	await page.click( menuSelector );

	if ( waitFor ) {
		const opts = waitFor === 'close' ? { hidden: true } : {};
		const menuContentSelector =
			context === 'post-editor'
				? SELECTORS.postEditorMenuContent
				: SELECTORS.siteEditorMenuContent;

		await page.waitForSelector( menuContentSelector, opts );
	}
}
