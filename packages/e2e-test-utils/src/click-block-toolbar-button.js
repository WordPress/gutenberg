/**
 * Clicks a block toolbar button.
 *
 * @param {string} buttonAriaLabel The aria label of the button to click.
 */
export async function clickBlockToolbarButton( buttonAriaLabel ) {
	const BLOCK_TOOLBAR_SELECTOR = '.block-editor-block-toolbar';
	const BUTTON_SELECTOR = `${ BLOCK_TOOLBAR_SELECTOR } button[aria-label="${ buttonAriaLabel }"]`;
	if ( await page.$( BLOCK_TOOLBAR_SELECTOR ) === null ) {
		// Press escape to show the block toolbar
		await page.keyboard.press( 'Escape' );
	}
	await page.waitForSelector( BUTTON_SELECTOR );
	await page.click( BUTTON_SELECTOR );
}
