/**
 * Clicks the default block appender.
 */
export async function clickBlockAppender() {
	await page.click( '.block-editor-default-block-appender__content' );
	await page.waitForSelector( '[data-type="core/paragraph"]' );
}
