/** @typedef {import('@playwright/test').Page} Page */

/**
 * Opens the preview page of an edited post.
 *
 * @this {import('./').PageUtils}
 * @return {Page} preview page.
 */
export async function openPreviewPage() {
	const editorTopBar = this.page.locator(
		'role=region[name="Editor top bar"i]'
	);
	const previewButton = editorTopBar.locator(
		'role=button[name="Preview"i]'
	);
	await previewButton.click();

	const [ previewPage ] = await Promise.all( [
		this.context.waitForEvent( 'page' ),
		this.page.click( 'role=menuitem[name="Preview in new tab"i]' ),
	] );

	return previewPage;
}
