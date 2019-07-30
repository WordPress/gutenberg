/**
 * Converts editor's block type.
 *
 * @param {string} name Block name.
 */
export async function transformBlockTo( name ) {
	await page.mouse.move( 200, 300, { steps: 10 } );
	await page.mouse.move( 250, 350, { steps: 10 } );
	await page.click( '.block-editor-block-switcher__toggle' );
	// Close the "Block Styles" section if it is open.
	// Having the section open may make the transform buttons hidden on the testing resolution.
	const closeBlockStylesButton = await page.$x(
		'//div[contains(@class,"block-editor-block-switcher__popover")]//button[contains(text(),"Block Styles")][@aria-expanded="true"]'
	);
	if ( closeBlockStylesButton.length > 0 ) {
		await closeBlockStylesButton[ 0 ].click();
	}
	const insertButton = ( await page.$x(
		`//button//span[contains(text(), '${ name }')]`
	) )[ 0 ];
	await insertButton.click();
	const BLOCK_SELECTOR = '.block-editor-block-list__block';
	const BLOCK_NAME_SELECTOR = `[aria-label="Block: ${ name }"]`;
	// Wait for the transformed block to appear.
	await page.waitForSelector(
		`${ BLOCK_SELECTOR }${ BLOCK_NAME_SELECTOR }`
	);
}
