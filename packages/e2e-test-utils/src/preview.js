/** @typedef {import('puppeteer-core').Page} Page */

/**
 * Opens the preview page of an edited post.
 *
 * @param {Page} editorPage puppeteer editor page.
 * @return {Page} preview page.
 */
export async function openPreviewPage( editorPage = page ) {
	let openTabs = await browser.pages();
	const expectedTabsCount = openTabs.length + 1;
	await page.waitForSelector(
		'.editor-preview-dropdown__toggle:not([disabled])'
	);
	await editorPage.click( '.editor-preview-dropdown__toggle' );
	await editorPage.waitForSelector(
		'.editor-preview-dropdown__button-external'
	);
	await editorPage.click( '.editor-preview-dropdown__button-external' );

	// Wait for the new tab to open.
	while ( openTabs.length < expectedTabsCount ) {
		await editorPage.waitForTimeout( 1 );
		openTabs = await browser.pages();
	}

	const previewPage = openTabs[ openTabs.length - 1 ];
	return previewPage;
}
