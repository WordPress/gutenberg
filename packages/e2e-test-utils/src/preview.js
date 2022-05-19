/**
 * External dependencies
 */
import { last } from 'lodash';

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
		'.block-editor-post-preview__button-toggle:not([disabled])'
	);
	await editorPage.click( '.block-editor-post-preview__button-toggle' );
	await editorPage.waitForSelector(
		'.edit-post-header-preview__button-external'
	);
	await editorPage.click( '.edit-post-header-preview__button-external' );

	// Wait for the new tab to open.
	while ( openTabs.length < expectedTabsCount ) {
		await editorPage.waitForTimeout( 1 );
		openTabs = await browser.pages();
	}

	const previewPage = last( openTabs );
	return previewPage;
}
