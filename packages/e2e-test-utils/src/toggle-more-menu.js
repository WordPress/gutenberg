/**
 * @typedef {import("./shared/types").GutenbergContext} GutenbergContext
 */

const SELECTORS = {
	menuContent: '.components-popover__content',
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
	const selector =
		context === 'post-editor'
			? SELECTORS.postEditorMenu
			: SELECTORS.siteEditorMenu;

	await page.click( selector );

	if ( waitFor ) {
		const opts = waitFor === 'close' ? { hidden: true } : {};
		await page.waitForSelector( SELECTORS.menuContent, opts );
	}
}
