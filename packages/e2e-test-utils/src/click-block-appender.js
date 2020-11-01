/**
 * Clicks the default block appender.
 */
export async function clickBlockAppender() {
	const appender = await page.waitForSelector(
		'.block-editor-default-block-appender__content'
	);
	await appender.click();
}
