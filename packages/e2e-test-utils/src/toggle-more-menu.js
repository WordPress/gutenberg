const SELECTORS = {
	menuContent: '.components-popover__content',
	postEditorMenu: '.edit-post-more-menu [aria-label="Options"]',
	siteEditorMenu: '.edit-site-more-menu [aria-label="More tools & options"]',
};

/**
 * Toggles the More Menu.
 *
 * @param {'post-editor' | 'site-editor'} [context='post-editor'] Whether it's toggling in the context of the site editor or post editor.
 */
export async function toggleMoreMenu( context = 'post-editor' ) {
	const selector =
		context === 'post-editor'
			? SELECTORS.postEditorMenu
			: SELECTORS.siteEditorMenu;

	await page.click( selector );
	await page.waitForSelector( SELECTORS.menuContent );
}
