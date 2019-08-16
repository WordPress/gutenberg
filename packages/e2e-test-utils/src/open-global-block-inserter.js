/**
 * Opens the global block inserter.
 */
export async function openGlobalBlockInserter() {
	// Click whichever is the first inserter button.
	await page.click( '.block-editor-inserter__toggle' );
	// Waiting here is necessary because sometimes the inserter takes more time to
	// render than Puppeteer takes to complete the 'click' action
	await page.waitForSelector( '.block-editor-inserter__menu' );
}
