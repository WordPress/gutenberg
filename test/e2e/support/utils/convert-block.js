/**
 * Converts editor's block type.
 *
 * @param {string} name Block name.
 */
export async function convertBlock( name ) {
	await page.mouse.move( 200, 300, { steps: 10 } );
	await page.mouse.move( 250, 350, { steps: 10 } );
	const switcherToggle = await page.waitForSelector( '.editor-block-switcher__toggle' );
	await page.evaluate( ( element ) => element.scrollIntoView(), switcherToggle );
	await page.waitForSelector( '.editor-block-switcher__toggle', { visible: true } );
	await switcherToggle.click();
	await page.waitForSelector( '.editor-block-switcher__popover', { visible: true } );

	// Find the block button option within the switcher popover.
	const insertButton = await page.waitForSelector(
		`.editor-block-switcher__popover .editor-block-types-list__item[aria-label="${ name }"]`,
		{ visible: true }
	);
	// Clicks may fail if the button is out of view. Assure it is before click.
	await page.evaluate( ( element ) => element.scrollIntoView(), insertButton );
	await insertButton.click();

	// Wait for the transformed block to appear.
	await page.waitForSelector( `.editor-block-list__block[aria-label="Block: ${ name }"]` );
}
