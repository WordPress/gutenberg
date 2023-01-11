/**
 * Clicks on the block inspector tab button with the supplied label and waits
 * for the tab switch.
 *
 * @param { string } label Aria label to find tab button by.
 */
export async function switchBlockInspectorTab( label ) {
	const tabButton = await page.$(
		`.block-editor-block-inspector__tabs button[aria-label="${ label }"]`
	);

	if ( tabButton ) {
		const id = await page.evaluate( ( tab ) => tab.id, tabButton );
		await tabButton.click();
		await page.waitForSelector(
			`div[role="tabpanel"][aria-labelledby="${ id }"]`
		);
	}
}
