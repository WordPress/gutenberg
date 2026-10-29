/**
 * Clicks a block toolbar button.
 *
 * @param {string} buttonAriaLabel The aria label of the button to click.
 */
export async function clickBlockToolbarButton( buttonAriaLabel ) {
	const BLOCK_TOOLBAR_SELECTOR = '.block-editor-block-toolbar';
	const BUTTON_SELECTOR = `${ BLOCK_TOOLBAR_SELECTOR } button[aria-label="${ buttonAriaLabel }"]`;
	if ( ( await page.$( BLOCK_TOOLBAR_SELECTOR ) ) === null ) {
		// Move the mouse to show the block toolbar
		await page.mouse.move( 0, 0 );
		await page.mouse.move( 10, 10 );
	}
	const button = await page.waitForSelector( BUTTON_SELECTOR, {
		visible: true,
	} );
	// Clicks may fail if the button is out of view. Assure it is before click.
	await button.evaluate( ( element ) => element.scrollIntoView() );
	/*
	 * The block toolbar can still be shown or repositioned after the button is
	 * visible, which makes the click fail. Wait until the button has a size and
	 * stops moving.
	 */
	await page.waitForFunction(
		( element ) => {
			const { x, y, width, height } = element.getBoundingClientRect();
			const position = `${ x },${ y },${ width },${ height }`;
			const isStable =
				width > 0 &&
				height > 0 &&
				element.dataset.e2ePosition === position;
			element.dataset.e2ePosition = position;
			return isStable;
		},
		{ polling: 'raf' },
		button
	);
	await button.click();
}
