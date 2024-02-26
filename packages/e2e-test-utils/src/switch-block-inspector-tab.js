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

	if ( ! tabButton ) {
		throw new Error( `Missing block inspector tab: ${ label }.` );
	}

	const id = await ( await tabButton.getProperty( 'id' ) ).jsonValue();
	await tabButton.click();
	await page.waitForSelector(
		`div[role="tabpanel"][aria-labelledby="${ id }"]`
	);
}
